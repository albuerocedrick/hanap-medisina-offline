# Medicinal Plant Leaf Classification
## MobileNetV3-Large Training Pipeline — Code & Explanation
*Google Colab / TensorFlow-Keras Implementation — Upgraded from the MobileNetV2 pipeline*

## Overview

This document is the MobileNetV3-Large version of your training pipeline, built for maximum accuracy on your balanced, 8,960-image dataset. Every cell is explained, followed by what changed relative to the MobileNetV2 pipeline and why, then the full working code.

The overall flow is the same as before: Cell 4 (initial training with a frozen base) leads into Cell 5 (evaluation). If results are unsatisfactory, Cell 7 (fine-tuning with the top layers unfrozen) is run, followed by Cell 5 again. Once results are acceptable, Cell 6 exports the model to TFLite — with an optional Cell 6b for a full-integer quantized variant that typically retains more accuracy through conversion than the default dynamic-range export.

Four things are different about how MobileNetV3-Large is handled compared to V2, and they matter for accuracy — each is explained in its relevant cell below:
1. V3 has built-in preprocessing, so raw `[0,255]` pixels are fed in directly, not pre-scaled.
2. V3's base model has a different, deeper layer count than V2, so the fine-tuning freeze point is calculated as a proportion rather than a hardcoded layer number.
3. Label smoothing and a slightly larger classification head are added to make better use of V3's richer feature extraction.
4. The data pipeline uses **pad-then-resize** (`tf.image.resize_with_pad`) instead of stretch-resize, so mixed-aspect-ratio photos (portrait, landscape, 1:1) don't distort leaf shape — and the Flutter app must mirror this same transform at inference time.

---

## Cell 1: Mount Google Drive

**What it does**
Connects the Colab environment to Google Drive so the notebook can read and write files inside the `hanap-medisina-dataset` folder — this includes the dataset itself, and later, the saved model and labels file. Running this cell will prompt a permission pop-up to authorize Drive access.

**What changed**
*Nothing. This cell is identical to the V2 pipeline.*

**Code**
```python
from google.colab import drive

drive.mount('/content/drive')

import os
base_dir = '/content/drive/MyDrive/hanap-medisina-dataset'
print("Dataset found:", os.path.exists(base_dir))
```

---

## Cell 2: Set Up Data Pipeline

**What it does**
Loads images from the train, val, and test folders, **pads each image to a square then resizes to 224×224** (preserving aspect ratio instead of stretching), batches them, and applies real-time data augmentation to the training set only — rotation, shifting, flipping, zoom, and brightness variation — so the model sees more visual variety without needing more raw captured images.

**What changed from the V2 version**

| Change | Why |
|---|---|
| No `preprocess_input` / no `rescale=1./255` | This is the single most important difference from V2. MobileNetV3Large (built with `include_preprocessing=True`, set in Cell 3) already contains Rescaling and Normalization layers as its first layers, and expects raw pixel values in [0, 255]. Manually rescaling here would double-preprocess the images — quietly feeding the model normalized-then-renormalized pixels — which is the V3 equivalent of the mismatch that was fixed for V2, just in the opposite direction. |
| Replaced `ImageDataGenerator` + `flow_from_directory` with a `tf.data` pipeline using `tf.image.resize_with_pad` | `flow_from_directory` with `target_size=(224,224)` stretches every image to a square, distorting leaf shape by a different amount depending on the original aspect ratio. Your dataset has genuinely mixed ratios — portrait single-leaf shots, landscape shots, and tight 1:1 crops. `tf.image.resize_with_pad` pads the shorter edge to make the image square first, then resizes, so every image reaches 224×224 without any shape distortion. **Your Flutter app must mirror this same pad-then-resize transform at inference time.** |
| Added `brightness_range=[0.8, 1.2]` equivalent via `tf.image` random brightness | Your defense will be evaluated under computer-lab lighting, and your dataset spans several capture sessions with different lighting. Brightness augmentation helps the model tolerate that lighting variance instead of overfitting to one specific brightness level. |
| Kept `tf.random.set_seed(42)`, `np.random.seed(42)`, `seed=42` | Same reproducibility guarantee as the V2 pipeline — consistent results every run, which matters for reporting in a thesis defense. |

**Code**
```python
import tensorflow as tf
import numpy as np
import os

# Reproducibility
tf.random.set_seed(42)
np.random.seed(42)

train_dir = '/content/drive/MyDrive/hanap-medisina-dataset/train'
val_dir   = '/content/drive/MyDrive/hanap-medisina-dataset/val'
test_dir  = '/content/drive/MyDrive/hanap-medisina-dataset/test'

IMG_SIZE   = 224
BATCH_SIZE = 32

# ── Discover class names from folder structure ───────────────────────────────
# Sorted alphabetically so the label order is deterministic and matches
# what Cell 6 writes to labels.txt.
class_names = sorted([
    d for d in os.listdir(train_dir)
    if os.path.isdir(os.path.join(train_dir, d))
])
class_indices = {name: i for i, name in enumerate(class_names)}
NUM_CLASSES   = len(class_names)

print(f"Number of plant classes detected: {NUM_CLASSES}")
print(f"Class mapping: {class_indices}")

# ── Collect file paths and integer labels ────────────────────────────────────
def collect_paths_labels(directory):
    paths, labels = [], []
    for cls_name in class_names:
        cls_dir = os.path.join(directory, cls_name)
        if not os.path.isdir(cls_dir):
            continue
        for fname in sorted(os.listdir(cls_dir)):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                paths.append(os.path.join(cls_dir, fname))
                labels.append(class_indices[cls_name])
    return paths, labels

train_paths, train_labels_list = collect_paths_labels(train_dir)
val_paths,   val_labels_list   = collect_paths_labels(val_dir)
test_paths,  test_labels_list  = collect_paths_labels(test_dir)

# Needed by Cell 4 for compute_class_weight
train_classes = np.array(train_labels_list)

# ── Core loading function: decode → pad-to-square → resize ──────────────────
# This is the KEY change from the V2 pipeline. Instead of stretching every
# image to 224×224 (which distorts mixed aspect ratios), we pad the shorter
# edge to make the image square first, then resize. This preserves leaf
# shape regardless of whether the original photo was portrait, landscape,
# or already square. Padding uses black (0), which matches the fill_value
# used by the augmentation layers below.
#
# NOTE: MobileNetV3Large (include_preprocessing=True) expects raw pixel
# values in [0, 255] and rescales/normalizes internally. Do NOT apply
# rescale=1./255 or any manual normalization here.
def load_and_pad(file_path, label):
    img = tf.io.read_file(file_path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.cast(img, tf.float32)
    img = tf.image.resize_with_pad(img, IMG_SIZE, IMG_SIZE)
    return img, label

# ── Augmentation (training only) ────────────────────────────────────────────
# Equivalent to the original ImageDataGenerator settings:
#   rotation_range=30, width/height_shift_range=0.2,
#   horizontal_flip=True, zoom_range=0.2, brightness_range=[0.8, 1.2]
augmentation_layers = tf.keras.Sequential([
    tf.keras.layers.RandomRotation(
        factor=30/360,           # ±30 degrees
        fill_mode='constant',    # pad exposed areas with black (matches padding)
        fill_value=0.0,
        seed=42,
    ),
    tf.keras.layers.RandomZoom(
        height_factor=(-0.2, 0.2),  # zoom range [0.8×, 1.2×]
        fill_mode='constant',
        fill_value=0.0,
        seed=42,
    ),
    tf.keras.layers.RandomTranslation(
        height_factor=0.2,       # ±20% vertical shift
        width_factor=0.2,        # ±20% horizontal shift
        fill_mode='constant',
        fill_value=0.0,
        seed=42,
    ),
    tf.keras.layers.RandomFlip('horizontal', seed=42),
])

def augment(img, label):
    img = augmentation_layers(img, training=True)
    # Brightness: multiply by random factor in [0.8, 1.2]
    # (matches ImageDataGenerator's brightness_range=[0.8, 1.2])
    brightness_factor = tf.random.uniform([], 0.8, 1.2)
    img = img * brightness_factor
    img = tf.clip_by_value(img, 0.0, 255.0)
    return img, label

# ── Build tf.data pipelines ─────────────────────────────────────────────────
def build_dataset(paths, labels, is_training=False):
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if is_training:
        ds = ds.shuffle(len(paths), seed=42, reshuffle_each_iteration=True)
    ds = ds.map(load_and_pad, num_parallel_calls=tf.data.AUTOTUNE)
    if is_training:
        ds = ds.map(augment, num_parallel_calls=tf.data.AUTOTUNE)
    ds = ds.map(lambda img, lbl: (img, tf.one_hot(lbl, NUM_CLASSES)))
    ds = ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    return ds

print("\nLoading Training Data:")
train_generator = build_dataset(train_paths, train_labels_list, is_training=True)
print(f"  Found {len(train_paths)} images belonging to {NUM_CLASSES} classes.")

print("\nLoading Validation Data:")
val_generator = build_dataset(val_paths, val_labels_list)
print(f"  Found {len(val_paths)} images belonging to {NUM_CLASSES} classes.")

print("\nLoading Testing Data:")
test_generator = build_dataset(test_paths, test_labels_list)
print(f"  Found {len(test_paths)} images belonging to {NUM_CLASSES} classes.")

# ── Dataset summary ─────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"{'FINAL DATASET SUMMARY':^60}")
print(f"{'='*60}")
print(f"{'Class':<20}{'Train':>8}{'Validate':>10}{'Test':>8}{'Total':>8}")
print(f"{'-'*60}")
for cls_name in class_names:
    idx = class_indices[cls_name]
    tr = sum(1 for l in train_labels_list if l == idx)
    va = sum(1 for l in val_labels_list   if l == idx)
    te = sum(1 for l in test_labels_list  if l == idx)
    print(f"{cls_name:<20}{tr:>8}{va:>10}{te:>8}{tr+va+te:>8}")
print(f"{'-'*60}")
print(f"{'TOTAL':<20}{len(train_paths):>8}{len(val_paths):>10}{len(test_paths):>8}"
      f"{len(train_paths)+len(val_paths)+len(test_paths):>8}")
print(f"{'='*60}")
```

---

## Cell 3: Build the MobileNetV3-Large Architecture

**What it does**
Downloads MobileNetV3-Large pretrained on ImageNet, removes its original classification head, freezes all of its layers so the pretrained visual features stay intact, and attaches a new classification head sized for your 12 classes (11 plants + unknown).

**What changed from the V2 version**

| Change | Why |
|---|---|
| `MobileNetV3Large(..., include_preprocessing=True)` | Swaps the backbone from V2 to V3-Large. `include_preprocessing=True` (the default) builds the Rescaling/Normalization layers into the model itself — this is what makes Cell 2's raw-pixel input correct. V3-Large's squeeze-and-excite blocks and h-swish activations give it better accuracy per parameter than V2, particularly useful for telling visually similar tree species like Bayabas, Mango, and Madre-cacao apart. |
| `Dense(256)` instead of `Dense(128)`, plus `BatchNormalization` | V3-Large's final feature layer carries richer information than V2's; a slightly larger head (256 units) with batch normalization lets the classifier make fuller use of it without destabilizing training, while `Dropout(0.3)` is kept to guard against overfitting on your per-class dataset size. |
| `CategoricalCrossentropy(label_smoothing=0.1)` instead of the plain string `'categorical_crossentropy'` | Label smoothing softens the training targets slightly (e.g. 0.91/0.01 instead of 1.0/0.0 across classes), which discourages the model from becoming overconfident on any single class. This directly helps with your hardest problem: visually similar species producing high-confidence wrong answers, which is exactly what label smoothing is designed to reduce. |

**Code**
```python
from tensorflow.keras.applications import MobileNetV3Large
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model

base_model = MobileNetV3Large(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet',
    include_preprocessing=True  # model rescales/normalizes raw [0,255] pixels internally
)

base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.3)(x)  # helps prevent overfitting
predictions = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
    metrics=['accuracy']
)

model.summary()
print(f"\nTotal layers in MobileNetV3-Large base: {len(base_model.layers)}")
print("Model built and compiled successfully!")
```

---

## Cell 4: Train the AI

**What it does**
Trains only the new head layers (the base model stays frozen) for up to 20 epochs, checking performance against the validation set after each epoch.

**What changed from the V2 version**

| Change | Why |
|---|---|
| Added `ReduceLROnPlateau(monitor='val_accuracy', factor=0.5, patience=2, min_lr=1e-6)` | If validation accuracy stalls for 2 consecutive epochs, the learning rate is halved automatically rather than staying fixed. This often squeezes out extra accuracy in the final epochs before EarlyStopping triggers, which matters when the goal is maximum accuracy rather than just a working model. |
| `EPOCHS` raised from 15 to 20; `EarlyStopping` patience raised from 4 to 5 | V3-Large's richer head (256 units + batch norm) benefits from a slightly longer training budget before EarlyStopping cuts it off, especially combined with ReduceLROnPlateau's smaller late-stage learning rate steps. |
| Kept `EarlyStopping(restore_best_weights=True)`, `ModelCheckpoint(save_best_only=True)`, and `class_weight` via `compute_class_weight` | Same overfitting protection and class-imbalance correction as the V2 pipeline — your unknown class (1,280 images) is still a different size than your plant classes (640 each), so this remains necessary. |

**Code**
```python
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight

# Handle class imbalance (your "unknown" folder has more images than each plant class)
class_weights_array = compute_class_weight(
    class_weight='balanced',
    classes=np.unique(train_classes),
    y=train_classes
)
class_weights = dict(enumerate(class_weights_array))
print("Class weights:", class_weights)

EPOCHS = 20

callbacks = [
    EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
    ModelCheckpoint(
        '/content/drive/MyDrive/hanap-medisina-dataset/best_model_v3.keras',
        monitor='val_accuracy',
        save_best_only=True
    ),
    ReduceLROnPlateau(monitor='val_accuracy', factor=0.5, patience=2, min_lr=1e-6)
]

print("Starting training process...")

history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=val_generator,
    class_weight=class_weights,
    callbacks=callbacks
)

print("Training complete!")
```

---

## Cell 5: The Final Exam (Evaluating the Test Set)

**What it does**
Runs the trained model against the test set — data it has never seen during training or validation — to get an honest estimate of real-world performance, plus a per-class classification report and confusion matrix. If results are unsatisfactory, proceed to Cell 7 for fine-tuning before running Cell 6.

**What changed from the V2 version**
*Uses `test_labels_list` and `class_names` from Cell 2 instead of `test_generator.classes` and `test_generator.class_indices` (which were ImageDataGenerator attributes — no longer available with the tf.data pipeline). `test_generator.reset()` is also removed since tf.data datasets re-iterate automatically. File names updated to the `_v3` suffix for clarity.*

**Code**
```python
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix

print("Evaluating model on the unseen Test Set...")
test_loss, test_accuracy = model.evaluate(test_generator)

print(f"\n--- FINAL EXAM RESULTS ---")
print(f"Real-World Accuracy: {test_accuracy * 100:.2f}%")
print(f"Loss: {test_loss:.4f}")

# Detailed per-class performance
preds = model.predict(test_generator)
y_pred = np.argmax(preds, axis=1)
y_true = np.array(test_labels_list)
class_labels = class_names

print("\n--- CLASSIFICATION REPORT ---")
print(classification_report(y_true, y_pred, target_names=class_labels))

cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', xticklabels=class_labels, yticklabels=class_labels, cmap='Blues')
plt.xlabel('Predicted')
plt.ylabel('True')
plt.title('Confusion Matrix - MobileNetV3-Large')
plt.tight_layout()
plt.savefig('/content/drive/MyDrive/hanap-medisina-dataset/confusion_matrix_v3.png')
plt.show()
```

---

## Cell 6: Export to TFLite and Save Labels

**What it does**
Run this cell once satisfied with the real-world accuracy from Cell 5. It compresses the trained model into a lightweight `.tflite` file suitable for the Flutter app, using dynamic-range quantization, and writes a `labels.txt` file mapping output index to plant name.

**What changed from the V2 version**
*Nothing structural — file names updated to the `_v3` suffix. See Cell 6b below for an optional, more accurate quantization method worth trying before your final export.*

**Code**
```python
print("Converting model to TFLite format (dynamic-range quantization)...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

tflite_path = '/content/drive/MyDrive/hanap-medisina-dataset/medicinal_model_v3.tflite'
with open(tflite_path, 'wb') as f:
    f.write(tflite_model)
print(f"Model saved to: {tflite_path}")

print("\nExtracting labels...")
labels = list(class_indices.keys())

labels_path = '/content/drive/MyDrive/hanap-medisina-dataset/labels.txt'
with open(labels_path, 'w') as f:
    for label in labels:
        f.write(f"{label}\n")

print(f"Labels saved to: {labels_path}")
print("You are ready to integrate into Flutter!")
```

---

## Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention

**What it does**
Produces a second, alternative `.tflite` export using full-integer post-training quantization with a representative dataset. Rather than quantizing weights only (as Cell 6 does), this calibrates the quantization ranges using real sample images, which typically preserves more accuracy through the float-to-int8 conversion than dynamic-range quantization alone, while also producing a smaller, faster file.

**Why this is worth trying**
Quantization always costs some accuracy, and dynamic-range quantization (Cell 6) makes assumptions about the value ranges without ever looking at real data. Full-integer quantization instead runs a batch of real training images through the model first, measures the actual activation ranges layer by layer, and calibrates the int8 conversion to those observed ranges. For a fine-grained task like distinguishing similar leaf species, this calibration step can meaningfully reduce the accuracy gap between your Keras model and the deployed `.tflite` file. Run both Cell 6 and Cell 6b, then compare their accuracy on a held-out set of images run through each `.tflite` file — keep whichever performs better for your Flutter app.

**Code**
```python
print("Converting model to TFLite format (full-integer quantization)...")

def representative_dataset():
    # Draws real images from the training dataset to calibrate quantization ranges
    for batch_images, _ in train_generator.take(200):
        for image in batch_images:
            yield [tf.expand_dims(image, axis=0)]

converter_int8 = tf.lite.TFLiteConverter.from_keras_model(model)
converter_int8.optimizations = [tf.lite.Optimize.DEFAULT]
converter_int8.representative_dataset = representative_dataset
# Keep input/output as float32 so the Flutter app doesn't need to handle
# int8 scale/zero-point conversion manually
converter_int8.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS_INT8,
    tf.lite.OpsSet.TFLITE_BUILTINS
]
tflite_model_int8 = converter_int8.convert()

int8_path = '/content/drive/MyDrive/hanap-medisina-dataset/medicinal_model_v3_int8.tflite'
with open(int8_path, 'wb') as f:
    f.write(tflite_model_int8)

print(f"Full-integer quantized model saved to: {int8_path}")
print(f"Dynamic-range size vs int8 size can now be compared directly in Drive.")
```

---

## Cell 7: The Retraining Phase (Fine-Tuning)

**What it does**
Unfreezes the top portion of the MobileNetV3-Large base model and continues training with a much smaller learning rate, letting the model adjust its higher-level features specifically to leaf shapes and textures rather than relying only on generic ImageNet features. After running this cell, re-run Cell 5 to re-evaluate, then Cell 6 (and optionally 6b) if satisfied.

**What changed from the V2 version**

| Change | Why |
|---|---|
| `fine_tune_at = int(total_layers * 0.7)` instead of a hardcoded `fine_tune_at = 100` | MobileNetV3-Large has a different, deeper layer count than V2's 154 layers, so V2's hardcoded "unfreeze after layer 100" doesn't transfer directly — applied as-is, it would unfreeze a different, unintended proportion of the network. Calculating the freeze point as 70% of the total layer count keeps the same underlying strategy (unfreeze roughly the top third, keep early general-purpose features frozen) while adapting correctly to V3's architecture. |
| Loss kept as `CategoricalCrossentropy(label_smoothing=0.1)` | Matches Cell 3's compile settings so fine-tuning continues with the same confidence-calibration behavior established during head training. |
| Kept the `len(history.epoch)` fix for `initial_epoch`, `EarlyStopping` + `ModelCheckpoint` pattern, and `class_weight` | Same reasoning as the V2 pipeline: `len(history.epoch)` correctly accounts for EarlyStopping having possibly cut Cell 4 short, and the imbalance/overfitting protections remain necessary during fine-tuning. |

**Code**
```python
print("Preparing for Fine-Tuning...")

base_model.trainable = True

total_layers = len(base_model.layers)
print("Number of layers in the base model: ", total_layers)

# MobileNetV3-Large is deeper than V2, so the freeze point is calculated as a
# proportion of the total rather than a hardcoded layer number like V2's "100".
# Unfreezing the top 30% keeps the same strategy as the V2 pipeline: early,
# general-purpose features stay frozen, higher-level features adapt to leaves.
fine_tune_at = int(total_layers * 0.7)
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

print(f"Fine-tuning from layer {fine_tune_at} onward "
      f"({total_layers - fine_tune_at} trainable layers)")

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.00001),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
    metrics=['accuracy']
)

print("Model re-compiled with a low learning rate. Starting fine-tuning...")

FINE_TUNE_EPOCHS = 10
total_epochs = len(history.epoch) + FINE_TUNE_EPOCHS  # accounts for early stopping in Cell 4

fine_tune_callbacks = [
    EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
    ModelCheckpoint(
        '/content/drive/MyDrive/hanap-medisina-dataset/best_model_v3_finetuned.keras',
        monitor='val_accuracy',
        save_best_only=True
    ),
    ReduceLROnPlateau(monitor='val_accuracy', factor=0.5, patience=2, min_lr=1e-7)
]

history_fine = model.fit(
    train_generator,
    epochs=total_epochs,
    initial_epoch=len(history.epoch),
    validation_data=val_generator,
    class_weight=class_weights,
    callbacks=fine_tune_callbacks
)

print("Fine-tuning complete! You should see an improvement in val_accuracy.")
```

---

## Summary: Recommended Run Order

**1 → 2 → 3 → 4 → 5.** If test accuracy and the confusion matrix look acceptable, skip to 6 (and 6b to compare). If not, run 7, then 5 again to re-check, then 6 (and 6b).

Compare this model's Cell 5 confusion matrix directly against your original V2/360-image baseline and your balanced-160 retrain — specifically watch the Bayabas↔Mango and Madre-cacao↔Guyabano cells, since those are the confusion pairs this upgrade (label smoothing, V3-Large's squeeze-and-excite blocks, and the larger classification head) is most likely to improve.