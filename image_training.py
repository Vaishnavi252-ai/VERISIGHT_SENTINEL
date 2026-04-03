import tensorflow as tf
print("✅ TensorFlow version:", tf.__version__)
print("✅ GPU Available:", tf.config.list_physical_devices('GPU'))

# Kaggle already has tensorflow, keras, sklearn, matplotlib, pandas installed
# But keras-vggface is usually missing
# !pip install keras-vggface
# !pip install keras-applications

import matplotlib.pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, GlobalAveragePooling2D
from tensorflow.keras.layers import Dropout, Dense, BatchNormalization
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
from sklearn import metrics
import numpy as np

# Dataset path on Kaggle
base_path = '/kaggle/input/deepfake-dataset/real_vs_fake/real-vs-fake'

batch_size = 64
image_gen = ImageDataGenerator(rescale=1./255.)

train_flow = image_gen.flow_from_directory(
    base_path + '/train',
    target_size=(224, 224),
    batch_size=batch_size,
    class_mode='binary'
)
valid_flow = image_gen.flow_from_directory(
    base_path + '/valid',
    target_size=(224, 224),
    batch_size=batch_size,
    class_mode='binary'
)
test_flow = image_gen.flow_from_directory(
    base_path + '/test',
    target_size=(224, 224),
    batch_size=1,
    shuffle=False,
    class_mode='binary'
)

input_shape = (224,224,3)
activation = 'relu'
padding = 'same'
droprate = 0.1
epsilon = 0.001

model = Sequential()
model.add(BatchNormalization(input_shape=input_shape))

model.add(Conv2D(16, 3, activation=activation, padding=padding))
model.add(MaxPooling2D(2))
model.add(BatchNormalization(epsilon=epsilon))
model.add(Conv2D(32, 3, activation=activation, padding=padding))
model.add(MaxPooling2D(2))
model.add(BatchNormalization(epsilon=epsilon))
model.add(Dropout(droprate))

model.add(Conv2D(64, 3, activation=activation, padding=padding))
model.add(MaxPooling2D(2))
model.add(BatchNormalization(epsilon=epsilon))
model.add(Dropout(droprate))

model.add(Conv2D(128, 3, activation=activation, padding=padding))
model.add(MaxPooling2D(2))
model.add(BatchNormalization(epsilon=epsilon))
model.add(Dropout(droprate))

model.add(Conv2D(256, 3, activation=activation, padding=padding))
model.add(MaxPooling2D(2))
model.add(BatchNormalization(epsilon=epsilon))
model.add(Dropout(droprate))

model.add(Conv2D(512, 3, activation=activation, padding=padding))
model.add(MaxPooling2D(2))
model.add(BatchNormalization(epsilon=epsilon))
model.add(Dropout(droprate))

model.add(GlobalAveragePooling2D())
model.add(Dense(1, activation='sigmoid'))
model.summary()

model.compile(
    loss='binary_crossentropy',
    optimizer=Adam(0.0001),
    metrics=['accuracy']
)

train_steps = 40000 // batch_size
valid_steps = 5000 // batch_size

history = model.fit(
    train_flow,
    epochs=50,
    steps_per_epoch=train_steps,
    validation_data=valid_flow,
    validation_steps=valid_steps
)
print("Training Done")
model.save("custom_model.h5")
print("Model is saved")

def plot_loss(epochs, loss, val_loss):
    plt.plot(epochs, loss, 'bo', label='Training Loss')
    plt.plot(epochs, val_loss, 'orange', label='Validation Loss')
    plt.title('Training and Validation Loss')
    plt.legend()
    plt.show()

def plot_accuracy(epochs, acc, val_acc):
    plt.plot(epochs, acc, 'bo', label='Training Accuracy')
    plt.plot(epochs, val_acc, 'orange', label='Validation Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.legend()
    plt.show()

loss = history.history['loss']
val_loss = history.history['val_loss']
acc = history.history['accuracy']
val_acc = history.history['val_accuracy']

plot_loss(range(1, len(loss)+1), loss, val_loss)
plot_accuracy(range(1, len(acc)+1), acc, val_acc)

y_pred = model.predict(test_flow)
y_test = test_flow.classes

print("ROC AUC Score:", metrics.roc_auc_score(y_test, y_pred))
print("AP Score:", metrics.average_precision_score(y_test, y_pred))
print()
print(metrics.classification_report(y_test, y_pred > 0.5))