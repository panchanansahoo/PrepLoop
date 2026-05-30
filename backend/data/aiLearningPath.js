// AI & Machine Learning Learning Path - Complete with Theory, Problems, and Patterns

const aiLearningPath = {
  id: 'ai',
  title: 'AI & Machine Learning',
  description: 'Deep learning, neural networks, and modern AI techniques',
  duration: '10-12 weeks',
  difficulty: 'Advanced',
  prerequisite: 'ML fundamentals, calculus, linear algebra, Python programming',
  outcomes: [
    'Master deep learning architectures (CNN, RNN, Transformers)',
    'Build and train neural networks from scratch',
    'Understand modern AI techniques and applications',
    'Work with PyTorch/TensorFlow frameworks',
    'Implement state-of-the-art AI models',
    'Deploy AI models to production'
  ],
  modules: [
    {
      id: 'neural-networks',
      title: 'Neural Networks Fundamentals',
      description: 'Build deep learning foundation from scratch',
      topics: ['Perceptrons', 'Backpropagation', 'Activation Functions', 'Optimizers', 'Regularization'],
      estimatedTime: '2 weeks',
      unlocked: true,
      
      theory: {
        introduction: `Neural networks are computational models inspired by biological neural networks in animal brains. 
        They consist of interconnected nodes (neurons) organized in layers that process information and learn patterns from data.`,
        
        keyTopics: [
          {
            title: 'Perceptron',
            content: `The perceptron is the simplest form of a neural network, consisting of a single neuron. 
            It takes multiple inputs, applies weights, adds a bias, and passes through an activation function.
            
            Mathematical representation:
            y = f(w₁x₁ + w₂x₂ + ... + wₙxₙ + b)
            
            where:
            - x₁, x₂, ..., xₙ are inputs
            - w₁, w₂, ..., wₙ are weights
            - b is the bias
            - f is the activation function`,
            
            example: `
# Simple Perceptron Implementation
import numpy as np

class Perceptron:
    def __init__(self, input_size, learning_rate=0.01):
        self.weights = np.random.randn(input_size)
        self.bias = np.random.randn()
        self.lr = learning_rate
    
    def activation(self, x):
        # Step function
        return 1 if x >= 0 else 0
    
    def predict(self, inputs):
        weighted_sum = np.dot(inputs, self.weights) + self.bias
        return self.activation(weighted_sum)
    
    def train(self, inputs, target):
        prediction = self.predict(inputs)
        error = target - prediction
        
        # Update weights and bias
        self.weights += self.lr * error * inputs
        self.bias += self.lr * error
        
        return error
            `
          },
          {
            title: 'Activation Functions',
            content: `Activation functions introduce non-linearity into neural networks, allowing them to learn complex patterns.
            
            Common activation functions:
            
            1. Sigmoid: σ(x) = 1 / (1 + e^(-x))
               - Output range: (0, 1)
               - Use case: Binary classification, output layer
               - Problem: Vanishing gradient
            
            2. ReLU (Rectified Linear Unit): f(x) = max(0, x)
               - Output range: [0, ∞)
               - Use case: Hidden layers (most common)
               - Advantage: No vanishing gradient for positive values
            
            3. Tanh: tanh(x) = (e^x - e^(-x)) / (e^x + e^(-x))
               - Output range: (-1, 1)
               - Zero-centered, better than sigmoid
            
            4. Leaky ReLU: f(x) = max(0.01x, x)
               - Prevents dying ReLU problem
            
            5. Softmax: σ(x_i) = e^(x_i) / Σe^(x_j)
               - Use case: Multi-class classification output`,
            
            example: `
import numpy as np
import matplotlib.pyplot as plt

class ActivationFunctions:
    @staticmethod
    def sigmoid(x):
        return 1 / (1 + np.exp(-x))
    
    @staticmethod
    def sigmoid_derivative(x):
        s = ActivationFunctions.sigmoid(x)
        return s * (1 - s)
    
    @staticmethod
    def relu(x):
        return np.maximum(0, x)
    
    @staticmethod
    def relu_derivative(x):
        return (x > 0).astype(float)
    
    @staticmethod
    def tanh(x):
        return np.tanh(x)
    
    @staticmethod
    def tanh_derivative(x):
        return 1 - np.tanh(x) ** 2
    
    @staticmethod
    def leaky_relu(x, alpha=0.01):
        return np.where(x > 0, x, alpha * x)
    
    @staticmethod
    def softmax(x):
        exp_x = np.exp(x - np.max(x))
        return exp_x / np.sum(exp_x, axis=0)
            `
          },
          {
            title: 'Backpropagation',
            content: `Backpropagation is the algorithm used to train neural networks by computing gradients of the loss function 
            with respect to weights using the chain rule of calculus.
            
            Process:
            1. Forward Pass: Compute predictions layer by layer
            2. Compute Loss: Calculate error between prediction and target
            3. Backward Pass: Compute gradients from output to input
            4. Update Weights: Adjust weights using gradient descent
            
            Chain Rule Application:
            For a network with layers L1 -> L2 -> L3
            ∂Loss/∂W1 = ∂Loss/∂L3 * ∂L3/∂L2 * ∂L2/∂L1 * ∂L1/∂W1
            
            Gradient Descent Update:
            W_new = W_old - learning_rate * ∂Loss/∂W`,
            
            example: `
class NeuralNetwork:
    def __init__(self, layers):
        self.layers = layers
        self.weights = []
        self.biases = []
        
        # Initialize weights and biases
        for i in range(len(layers) - 1):
            w = np.random.randn(layers[i], layers[i+1]) * 0.01
            b = np.zeros((1, layers[i+1]))
            self.weights.append(w)
            self.biases.append(b)
    
    def forward(self, X):
        self.activations = [X]
        self.z_values = []
        
        for i in range(len(self.weights)):
            z = np.dot(self.activations[-1], self.weights[i]) + self.biases[i]
            self.z_values.append(z)
            
            if i == len(self.weights) - 1:
                a = self.sigmoid(z)  # Output layer
            else:
                a = self.relu(z)  # Hidden layers
            
            self.activations.append(a)
        
        return self.activations[-1]
    
    def backward(self, X, y, learning_rate):
        m = X.shape[0]
        
        # Output layer gradient
        dz = self.activations[-1] - y
        
        for i in range(len(self.weights) - 1, -1, -1):
            # Compute gradients
            dw = (1/m) * np.dot(self.activations[i].T, dz)
            db = (1/m) * np.sum(dz, axis=0, keepdims=True)
            
            if i > 0:
                # Gradient for previous layer
                da = np.dot(dz, self.weights[i].T)
                dz = da * self.relu_derivative(self.z_values[i-1])
            
            # Update weights and biases
            self.weights[i] -= learning_rate * dw
            self.biases[i] -= learning_rate * db
            `
          },
          {
            title: 'Optimization Algorithms',
            content: `Optimization algorithms determine how weights are updated during training.
            
            1. Gradient Descent (GD):
               W = W - η * ∂L/∂W
               - Uses entire dataset per update
               - Slow but stable
            
            2. Stochastic Gradient Descent (SGD):
               - Updates weights for each sample
               - Fast but noisy
            
            3. Mini-batch Gradient Descent:
               - Updates weights on batches
               - Balance between GD and SGD
            
            4. Momentum:
               v = β * v + ∂L/∂W
               W = W - η * v
               - Accelerates convergence
               - Reduces oscillations
            
            5. Adam (Adaptive Moment Estimation):
               - Combines momentum and RMSprop
               - Adaptive learning rates
               - Most popular optimizer
               
               m = β₁ * m + (1-β₁) * ∂L/∂W
               v = β₂ * v + (1-β₂) * (∂L/∂W)²
               W = W - η * m / (√v + ε)`,
            
            example: `
class Optimizers:
    class SGD:
        def __init__(self, learning_rate=0.01):
            self.lr = learning_rate
        
        def update(self, weights, gradients):
            return weights - self.lr * gradients
    
    class Momentum:
        def __init__(self, learning_rate=0.01, momentum=0.9):
            self.lr = learning_rate
            self.momentum = momentum
            self.velocity = None
        
        def update(self, weights, gradients):
            if self.velocity is None:
                self.velocity = np.zeros_like(weights)
            
            self.velocity = self.momentum * self.velocity + gradients
            return weights - self.lr * self.velocity
    
    class Adam:
        def __init__(self, learning_rate=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
            self.lr = learning_rate
            self.beta1 = beta1
            self.beta2 = beta2
            self.epsilon = epsilon
            self.m = None
            self.v = None
            self.t = 0
        
        def update(self, weights, gradients):
            if self.m is None:
                self.m = np.zeros_like(weights)
                self.v = np.zeros_like(weights)
            
            self.t += 1
            self.m = self.beta1 * self.m + (1 - self.beta1) * gradients
            self.v = self.beta2 * self.v + (1 - self.beta2) * gradients**2
            
            m_hat = self.m / (1 - self.beta1**self.t)
            v_hat = self.v / (1 - self.beta2**self.t)
            
            return weights - self.lr * m_hat / (np.sqrt(v_hat) + self.epsilon)
            `
          },
          {
            title: 'Regularization Techniques',
            content: `Regularization prevents overfitting by constraining model complexity.
            
            1. L1 Regularization (Lasso):
               Loss = Original_Loss + λ * Σ|w_i|
               - Creates sparse models
               - Feature selection
            
            2. L2 Regularization (Ridge):
               Loss = Original_Loss + λ * Σw_i²
               - Penalizes large weights
               - Prevents overfitting
            
            3. Dropout:
               - Randomly drops neurons during training
               - Prevents co-adaptation
               - Typical rate: 0.2-0.5
            
            4. Batch Normalization:
               - Normalizes layer inputs
               - Stabilizes training
               - Allows higher learning rates
               
               x_norm = (x - μ) / √(σ² + ε)
               y = γ * x_norm + β
            
            5. Early Stopping:
               - Stop training when validation loss increases
               - Prevents overfitting
            
            6. Data Augmentation:
               - Artificially expand training data
               - Improves generalization`,
            
            example: `
class RegularizationTechniques:
    @staticmethod
    def l2_regularization(weights, lambda_param):
        return lambda_param * np.sum(weights ** 2)
    
    @staticmethod
    def dropout(x, dropout_rate=0.5, training=True):
        if not training:
            return x
        
        mask = np.random.binomial(1, 1-dropout_rate, x.shape)
        return x * mask / (1 - dropout_rate)
    
    @staticmethod
    def batch_normalization(x, gamma, beta, epsilon=1e-5):
        mean = np.mean(x, axis=0)
        variance = np.var(x, axis=0)
        
        x_norm = (x - mean) / np.sqrt(variance + epsilon)
        out = gamma * x_norm + beta
        
        return out, mean, variance

class ImprovedNeuralNetwork:
    def __init__(self, layers, dropout_rate=0.5, lambda_reg=0.01):
        self.layers = layers
        self.dropout_rate = dropout_rate
        self.lambda_reg = lambda_reg
        self.initialize_weights()
    
    def train_step(self, X, y, learning_rate):
        # Forward pass with dropout
        predictions = self.forward(X, training=True)
        
        # Compute loss with L2 regularization
        loss = self.compute_loss(y, predictions)
        reg_loss = sum([np.sum(w**2) for w in self.weights])
        total_loss = loss + self.lambda_reg * reg_loss
        
        # Backward pass
        self.backward(X, y, learning_rate)
        
        return total_loss
            `
          }
        ],
        
        patterns: [
          {
            name: 'Feed-Forward Architecture',
            description: 'Sequential processing of data through layers',
            useCase: 'Standard neural network design',
            implementation: 'Input -> Hidden Layers -> Output',
            complexity: 'O(n * m) per layer, where n=inputs, m=outputs'
          },
          {
            name: 'Gradient Descent Pattern',
            description: 'Iterative optimization using gradients',
            useCase: 'Training neural networks',
            implementation: 'Compute gradient, update weights, repeat',
            complexity: 'O(n * m * e), where e=epochs'
          },
          {
            name: 'Mini-Batch Processing',
            description: 'Process data in small batches',
            useCase: 'Efficient training on large datasets',
            implementation: 'Split data into batches, process sequentially',
            complexity: 'O(n/b) iterations, where b=batch_size'
          }
        ]
      },
      
      problems: [
        {
          id: 'nn-1',
          title: 'Implement Single Neuron',
          difficulty: 'Easy',
          description: 'Implement a single neuron with multiple inputs, weights, and bias.',
          hints: [
            'Use numpy for vectorized operations',
            'Apply activation function after weighted sum',
            'Initialize weights randomly'
          ],
          solution: `
import numpy as np

class Neuron:
    def __init__(self, num_inputs):
        self.weights = np.random.randn(num_inputs) * 0.01
        self.bias = 0
    
    def forward(self, inputs):
        # Weighted sum + bias
        z = np.dot(inputs, self.weights) + self.bias
        # Sigmoid activation
        return 1 / (1 + np.exp(-z))

# Test
neuron = Neuron(3)
inputs = np.array([0.5, 0.3, 0.2])
output = neuron.forward(inputs)
print(f"Output: {output}")
          `,
          testCases: [
            'Input: [1, 0, 0] -> Output in range (0, 1)',
            'Input: [-1, -1, -1] -> Output close to 0',
            'Input: [1, 1, 1] -> Output close to 1'
          ]
        },
        {
          id: 'nn-2',
          title: 'Implement Activation Functions',
          difficulty: 'Easy',
          description: 'Implement ReLU, Sigmoid, and Tanh activation functions with their derivatives.',
          hints: [
            'ReLU: max(0, x)',
            'Sigmoid: 1 / (1 + e^(-x))',
            'Derivative of ReLU: 0 if x < 0, else 1'
          ],
          solution: `
import numpy as np

class ActivationFunctions:
    @staticmethod
    def relu(x):
        return np.maximum(0, x)
    
    @staticmethod
    def relu_derivative(x):
        return (x > 0).astype(float)
    
    @staticmethod
    def sigmoid(x):
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    
    @staticmethod
    def sigmoid_derivative(x):
        s = ActivationFunctions.sigmoid(x)
        return s * (1 - s)
    
    @staticmethod
    def tanh(x):
        return np.tanh(x)
    
    @staticmethod
    def tanh_derivative(x):
        return 1 - np.tanh(x) ** 2

# Test
x = np.array([-2, -1, 0, 1, 2])
print("ReLU:", ActivationFunctions.relu(x))
print("Sigmoid:", ActivationFunctions.sigmoid(x))
print("Tanh:", ActivationFunctions.tanh(x))
          `
        },
        {
          id: 'nn-3',
          title: 'Build 2-Layer Neural Network',
          difficulty: 'Medium',
          description: 'Create a neural network with one hidden layer for binary classification.',
          hints: [
            'Use ReLU for hidden layer, Sigmoid for output',
            'Implement forward and backward propagation',
            'Use binary cross-entropy loss'
          ],
          solution: `
import numpy as np

class TwoLayerNN:
    def __init__(self, input_size, hidden_size, output_size):
        self.W1 = np.random.randn(input_size, hidden_size) * 0.01
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * 0.01
        self.b2 = np.zeros((1, output_size))
    
    def forward(self, X):
        # Hidden layer
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = np.maximum(0, self.z1)  # ReLU
        
        # Output layer
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = 1 / (1 + np.exp(-self.z2))  # Sigmoid
        
        return self.a2
    
    def backward(self, X, y, learning_rate):
        m = X.shape[0]
        
        # Output layer gradient
        dz2 = self.a2 - y
        dW2 = (1/m) * np.dot(self.a1.T, dz2)
        db2 = (1/m) * np.sum(dz2, axis=0, keepdims=True)
        
        # Hidden layer gradient
        da1 = np.dot(dz2, self.W2.T)
        dz1 = da1 * (self.z1 > 0)  # ReLU derivative
        dW1 = (1/m) * np.dot(X.T, dz1)
        db1 = (1/m) * np.sum(dz1, axis=0, keepdims=True)
        
        # Update weights
        self.W1 -= learning_rate * dW1
        self.b1 -= learning_rate * db1
        self.W2 -= learning_rate * dW2
        self.b2 -= learning_rate * db2
    
    def train(self, X, y, epochs=1000, learning_rate=0.01):
        for epoch in range(epochs):
            # Forward pass
            predictions = self.forward(X)
            
            # Backward pass
            self.backward(X, y, learning_rate)
            
            if epoch % 100 == 0:
                loss = -np.mean(y * np.log(predictions + 1e-8) + 
                               (1-y) * np.log(1-predictions + 1e-8))
                print(f"Epoch {epoch}, Loss: {loss:.4f}")

# Test
X = np.random.randn(100, 2)
y = (X[:, 0] + X[:, 1] > 0).reshape(-1, 1).astype(float)
nn = TwoLayerNN(2, 4, 1)
nn.train(X, y, epochs=500)
          `
        },
        {
          id: 'nn-4',
          title: 'Implement Batch Normalization',
          difficulty: 'Medium',
          description: 'Add batch normalization layer to stabilize training.',
          solution: `
class BatchNormalization:
    def __init__(self, num_features, epsilon=1e-5, momentum=0.9):
        self.epsilon = epsilon
        self.momentum = momentum
        self.gamma = np.ones((1, num_features))
        self.beta = np.zeros((1, num_features))
        self.running_mean = np.zeros((1, num_features))
        self.running_var = np.ones((1, num_features))
    
    def forward(self, x, training=True):
        if training:
            mean = np.mean(x, axis=0, keepdims=True)
            var = np.var(x, axis=0, keepdims=True)
            
            self.running_mean = self.momentum * self.running_mean + (1-self.momentum) * mean
            self.running_var = self.momentum * self.running_var + (1-self.momentum) * var
            
            self.x_norm = (x - mean) / np.sqrt(var + self.epsilon)
        else:
            self.x_norm = (x - self.running_mean) / np.sqrt(self.running_var + self.epsilon)
        
        out = self.gamma * self.x_norm + self.beta
        return out
          `
        },
        {
          id: 'nn-5',
          title: 'Implement Dropout Regularization',
          difficulty: 'Medium',
          description: 'Add dropout to prevent overfitting during training.',
          solution: `
class Dropout:
    def __init__(self, dropout_rate=0.5):
        self.dropout_rate = dropout_rate
        self.mask = None
    
    def forward(self, x, training=True):
        if training:
            self.mask = np.random.binomial(1, 1-self.dropout_rate, x.shape)
            return x * self.mask / (1 - self.dropout_rate)
        return x
    
    def backward(self, dout):
        return dout * self.mask / (1 - self.dropout_rate)

# Integration example
class NeuralNetworkWithDropout:
    def __init__(self, layers, dropout_rate=0.5):
        self.layers = layers
        self.dropout = Dropout(dropout_rate)
        # ... initialize weights
    
    def forward(self, X, training=True):
        a = X
        for i, w in enumerate(self.weights[:-1]):
            z = np.dot(a, w) + self.biases[i]
            a = np.maximum(0, z)
            a = self.dropout.forward(a, training)
        
        # Output layer (no dropout)
        z = np.dot(a, self.weights[-1]) + self.biases[-1]
        return 1 / (1 + np.exp(-z))
          `
        },
        {
          id: 'nn-6',
          title: 'Implement Adam Optimizer',
          difficulty: 'Hard',
          description: 'Implement the Adam optimization algorithm from scratch.',
          solution: `
class AdamOptimizer:
    def __init__(self, learning_rate=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.t = 0
        self.m_weights = []
        self.v_weights = []
        self.m_biases = []
        self.v_biases = []
    
    def initialize(self, weights, biases):
        for w, b in zip(weights, biases):
            self.m_weights.append(np.zeros_like(w))
            self.v_weights.append(np.zeros_like(w))
            self.m_biases.append(np.zeros_like(b))
            self.v_biases.append(np.zeros_like(b))
    
    def update(self, weights, biases, dw_list, db_list):
        self.t += 1
        updated_weights = []
        updated_biases = []
        
        for i in range(len(weights)):
            # Update weights
            self.m_weights[i] = self.beta1 * self.m_weights[i] + (1-self.beta1) * dw_list[i]
            self.v_weights[i] = self.beta2 * self.v_weights[i] + (1-self.beta2) * dw_list[i]**2
            
            m_hat_w = self.m_weights[i] / (1 - self.beta1**self.t)
            v_hat_w = self.v_weights[i] / (1 - self.beta2**self.t)
            
            w_new = weights[i] - self.lr * m_hat_w / (np.sqrt(v_hat_w) + self.epsilon)
            updated_weights.append(w_new)
            
            # Update biases
            self.m_biases[i] = self.beta1 * self.m_biases[i] + (1-self.beta1) * db_list[i]
            self.v_biases[i] = self.beta2 * self.v_biases[i] + (1-self.beta2) * db_list[i]**2
            
            m_hat_b = self.m_biases[i] / (1 - self.beta1**self.t)
            v_hat_b = self.v_biases[i] / (1 - self.beta2**self.t)
            
            b_new = biases[i] - self.lr * m_hat_b / (np.sqrt(v_hat_b) + self.epsilon)
            updated_biases.append(b_new)
        
        return updated_weights, updated_biases
          `
        },
        {
          id: 'nn-7',
          title: 'Multi-Class Classification Network',
          difficulty: 'Hard',
          description: 'Build a neural network for multi-class classification with softmax output.',
          solution: `
class MultiClassNN:
    def __init__(self, input_size, hidden_sizes, num_classes):
        self.layers = [input_size] + hidden_sizes + [num_classes]
        self.weights = []
        self.biases = []
        
        for i in range(len(self.layers) - 1):
            w = np.random.randn(self.layers[i], self.layers[i+1]) * np.sqrt(2.0/self.layers[i])
            b = np.zeros((1, self.layers[i+1]))
            self.weights.append(w)
            self.biases.append(b)
    
    def softmax(self, x):
        exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
        return exp_x / np.sum(exp_x, axis=1, keepdims=True)
    
    def forward(self, X):
        self.activations = [X]
        self.z_values = []
        
        for i in range(len(self.weights)):
            z = np.dot(self.activations[-1], self.weights[i]) + self.biases[i]
            self.z_values.append(z)
            
            if i == len(self.weights) - 1:
                a = self.softmax(z)
            else:
                a = np.maximum(0, z)
            
            self.activations.append(a)
        
        return self.activations[-1]
    
    def compute_loss(self, y_true, y_pred):
        m = y_true.shape[0]
        log_likelihood = -np.log(y_pred[range(m), y_true])
        return np.sum(log_likelihood) / m
    
    def backward(self, X, y, learning_rate):
        m = X.shape[0]
        
        # One-hot encode labels
        y_one_hot = np.zeros((m, self.layers[-1]))
        y_one_hot[range(m), y] = 1
        
        # Output layer gradient
        dz = self.activations[-1] - y_one_hot
        
        for i in range(len(self.weights) - 1, -1, -1):
            dw = (1/m) * np.dot(self.activations[i].T, dz)
            db = (1/m) * np.sum(dz, axis=0, keepdims=True)
            
            if i > 0:
                da = np.dot(dz, self.weights[i].T)
                dz = da * (self.z_values[i-1] > 0)
            
            self.weights[i] -= learning_rate * dw
            self.biases[i] -= learning_rate * db
    
    def train(self, X, y, epochs=1000, learning_rate=0.01, batch_size=32):
        for epoch in range(epochs):
            # Mini-batch training
            indices = np.random.permutation(X.shape[0])
            for i in range(0, X.shape[0], batch_size):
                batch_idx = indices[i:i+batch_size]
                X_batch = X[batch_idx]
                y_batch = y[batch_idx]
                
                predictions = self.forward(X_batch)
                self.backward(X_batch, y_batch, learning_rate)
            
            if epoch % 100 == 0:
                predictions = self.forward(X)
                loss = self.compute_loss(y, predictions)
                accuracy = np.mean(np.argmax(predictions, axis=1) == y)
                print(f"Epoch {epoch}, Loss: {loss:.4f}, Accuracy: {accuracy:.4f}")
          `
        }
      ],
      
      lessons: [
        {
          title: 'Neural Network Basics',
          duration: '60 min',
          type: 'video',
          content: 'Introduction to neural networks, perceptrons, and basic architecture'
        },
        {
          title: 'Gradient Descent & Backpropagation',
          duration: '70 min',
          type: 'reading',
          content: 'Deep dive into training algorithms and optimization'
        },
        {
          title: 'Building Your First Network',
          duration: '50 min',
          type: 'video',
          content: 'Hands-on implementation of a simple neural network'
        },
        {
          title: 'Practice Implementation',
          duration: '4 hours',
          type: 'practice',
          content: 'Build neural networks from scratch and solve problems'
        }
      ]
    },
    
    // Module 2: CNN
    {
      id: 'cnn',
      title: 'Convolutional Neural Networks',
      description: 'Master CNNs for computer vision tasks',
      topics: ['Convolutions', 'Pooling', 'Transfer Learning', 'Object Detection', 'Image Segmentation'],
      estimatedTime: '2.5 weeks',
      unlocked: true,
      
      theory: {
        introduction: `Convolutional Neural Networks (CNNs) are specialized neural networks designed for processing grid-like data such as images. 
        They use convolution operations to automatically learn spatial hierarchies of features.`,
        
        keyTopics: [
          {
            title: 'Convolution Operation',
            content: `Convolution applies a filter (kernel) across the input to detect features like edges, textures, and patterns.
            
            Mathematical Definition:
            (f * g)[i,j] = ΣΣ f[m,n] × g[i-m, j-n]
            
            Key Concepts:
            - Kernel/Filter: Small matrix that slides over input
            - Stride: Step size when moving the filter
            - Padding: Adding zeros around input to control output size
            
            Output Size Formula:
            Output_size = (Input_size - Kernel_size + 2×Padding) / Stride + 1
            
            Example:
            Input: 32×32×3 (RGB image)
            Filter: 5×5×3, 10 filters
            Stride: 1, Padding: 0
            Output: 28×28×10`,
            
            example: `
import numpy as np

class Conv2D:
    def __init__(self, num_filters, filter_size, stride=1, padding=0):
        self.num_filters = num_filters
        self.filter_size = filter_size
        self.stride = stride
        self.padding = padding
        
        # Initialize filters with He initialization
        self.filters = np.random.randn(num_filters, filter_size, filter_size) * np.sqrt(2.0 / filter_size**2)
        self.biases = np.zeros(num_filters)
    
    def forward(self, input_data):
        self.input = input_data
        batch_size, height, width = input_data.shape
        
        # Add padding
        if self.padding > 0:
            input_padded = np.pad(input_data, 
                                 ((0, 0), (self.padding, self.padding), (self.padding, self.padding)),
                                 mode='constant')
        else:
            input_padded = input_data
        
        # Calculate output dimensions
        out_height = (height + 2*self.padding - self.filter_size) // self.stride + 1
        out_width = (width + 2*self.padding - self.filter_size) // self.stride + 1
        
        # Initialize output
        output = np.zeros((batch_size, self.num_filters, out_height, out_width))
        
        # Perform convolution
        for i in range(out_height):
            for j in range(out_width):
                h_start = i * self.stride
                h_end = h_start + self.filter_size
                w_start = j * self.stride
                w_end = w_start + self.filter_size
                
                # Extract region
                region = input_padded[:, h_start:h_end, w_start:w_end]
                
                # Apply filters
                for f in range(self.num_filters):
                    output[:, f, i, j] = np.sum(region * self.filters[f], axis=(1, 2)) + self.biases[f]
        
        return output
    
    def backward(self, dout, learning_rate):
        batch_size, _, out_height, out_width = dout.shape
        
        # Initialize gradients
        dfilters = np.zeros_like(self.filters)
        dbiases = np.sum(dout, axis=(0, 2, 3))
        dinput = np.zeros_like(self.input)
        
        # Pad input if necessary
        if self.padding > 0:
            input_padded = np.pad(self.input,
                                 ((0, 0), (self.padding, self.padding), (self.padding, self.padding)),
                                 mode='constant')
            dinput_padded = np.zeros_like(input_padded)
        else:
            input_padded = self.input
            dinput_padded = dinput
        
        # Compute gradients
        for i in range(out_height):
            for j in range(out_width):
                h_start = i * self.stride
                h_end = h_start + self.filter_size
                w_start = j * self.stride
                w_end = w_start + self.filter_size
                
                region = input_padded[:, h_start:h_end, w_start:w_end]
                
                for f in range(self.num_filters):
                    dfilters[f] += np.sum(region * dout[:, f:f+1, i:i+1, j:j+1], axis=0)
                    dinput_padded[:, h_start:h_end, w_start:w_end] += self.filters[f] * dout[:, f:f+1, i:i+1, j:j+1]
        
        # Remove padding from gradient
        if self.padding > 0:
            dinput = dinput_padded[:, self.padding:-self.padding, self.padding:-self.padding]
        else:
            dinput = dinput_padded
        
        # Update weights
        self.filters -= learning_rate * dfilters / batch_size
        self.biases -= learning_rate * dbiases / batch_size
        
        return dinput
            `
          },
          {
            title: 'Pooling Layers',
            content: `Pooling reduces spatial dimensions while retaining important features.
            
            Types of Pooling:
            
            1. Max Pooling:
               - Takes maximum value from each region
               - Most common
               - Preserves dominant features
               - Translation invariant
            
            2. Average Pooling:
               - Computes average of region
               - Smoother downsampling
               - Less common in modern architectures
            
            3. Global Average Pooling:
               - One value per channel
               - Reduces parameters
               - Used before final classification layer
            
            Common Configuration:
            - Pool size: 2×2
            - Stride: 2
            - Reduces dimensions by half
            
            Benefits:
            - Reduces computational cost
            - Controls overfitting
            - Provides translation invariance
            - Captures dominant features`,
            
            example: `
class MaxPool2D:
    def __init__(self, pool_size=2, stride=2):
        self.pool_size = pool_size
        self.stride = stride
    
    def forward(self, input_data):
        self.input = input_data
        batch_size, channels, height, width = input_data.shape
        
        out_height = (height - self.pool_size) // self.stride + 1
        out_width = (width - self.pool_size) // self.stride + 1
        
        output = np.zeros((batch_size, channels, out_height, out_width))
        self.max_indices = np.zeros_like(output, dtype=int)
        
        for i in range(out_height):
            for j in range(out_width):
                h_start = i * self.stride
                h_end = h_start + self.pool_size
                w_start = j * self.stride
                w_end = w_start + self.pool_size
                
                region = input_data[:, :, h_start:h_end, w_start:w_end]
                output[:, :, i, j] = np.max(region, axis=(2, 3))
        
        return output
    
    def backward(self, dout):
        batch_size, channels, out_height, out_width = dout.shape
        dinput = np.zeros_like(self.input)
        
        for i in range(out_height):
            for j in range(out_width):
                h_start = i * self.stride
                h_end = h_start + self.pool_size
                w_start = j * self.stride
                w_end = w_start + self.pool_size
                
                region = self.input[:, :, h_start:h_end, w_start:w_end]
                
                for b in range(batch_size):
                    for c in range(channels):
                        # Find max position
                        max_val = np.max(region[b, c])
                        mask = (region[b, c] == max_val)
                        dinput[b, c, h_start:h_end, w_start:w_end] += mask * dout[b, c, i, j]
        
        return dinput

class AveragePool2D:
    def __init__(self, pool_size=2, stride=2):
        self.pool_size = pool_size
        self.stride = stride
    
    def forward(self, input_data):
        self.input_shape = input_data.shape
        batch_size, channels, height, width = input_data.shape
        
        out_height = (height - self.pool_size) // self.stride + 1
        out_width = (width - self.pool_size) // self.stride + 1
        
        output = np.zeros((batch_size, channels, out_height, out_width))
        
        for i in range(out_height):
            for j in range(out_width):
                h_start = i * self.stride
                h_end = h_start + self.pool_size
                w_start = j * self.stride
                w_end = w_start + self.pool_size
                
                region = input_data[:, :, h_start:h_end, w_start:w_end]
                output[:, :, i, j] = np.mean(region, axis=(2, 3))
        
        return output
            `
          },
          {
            title: 'CNN Architectures',
            content: `Classic and modern CNN architectures that revolutionized computer vision.
            
            1. LeNet-5 (1998):
               - First successful CNN
               - Used for digit recognition
               - Architecture: Conv -> Pool -> Conv -> Pool -> FC -> FC
            
            2. AlexNet (2012):
               - Won ImageNet 2012
               - Introduced ReLU, Dropout
               - 8 layers, 60M parameters
               - GPU acceleration
            
            3. VGGNet (2014):
               - Simple architecture: 3×3 convolutions
               - VGG-16: 16 layers
               - VGG-19: 19 layers
               - 138M parameters
            
            4. ResNet (2015):
               - Introduced skip connections
               - Solves vanishing gradient
               - ResNet-50, ResNet-101, ResNet-152
               - Identity mapping: H(x) = F(x) + x
            
            5. Inception/GoogLeNet (2014):
               - Multiple filter sizes in parallel
               - 1×1 convolutions for dimension reduction
               - 22 layers, only 7M parameters
            
            6. MobileNet (2017):
               - Efficient for mobile devices
               - Depthwise separable convolutions
               - Trade-off between accuracy and speed
            
            7. EfficientNet (2019):
               - Compound scaling
               - Balances depth, width, resolution
               - State-of-the-art accuracy with fewer parameters`,
            
            example: `
# Simple CNN Architecture (similar to LeNet)
class SimpleCNN:
    def __init__(self, input_shape, num_classes):
        self.layers = []
        
        # Conv1: 32 filters, 3x3
        self.layers.append(Conv2D(32, 3, stride=1, padding=1))
        self.layers.append(ReLU())
        self.layers.append(MaxPool2D(2, 2))
        
        # Conv2: 64 filters, 3x3
        self.layers.append(Conv2D(64, 3, stride=1, padding=1))
        self.layers.append(ReLU())
        self.layers.append(MaxPool2D(2, 2))
        
        # Conv3: 128 filters, 3x3
        self.layers.append(Conv2D(128, 3, stride=1, padding=1))
        self.layers.append(ReLU())
        self.layers.append(MaxPool2D(2, 2))
        
        # Flatten
        self.layers.append(Flatten())
        
        # Fully connected layers
        self.layers.append(Dense(512))
        self.layers.append(ReLU())
        self.layers.append(Dropout(0.5))
        
        self.layers.append(Dense(num_classes))
        self.layers.append(Softmax())
    
    def forward(self, x, training=True):
        for layer in self.layers:
            if isinstance(layer, Dropout):
                x = layer.forward(x, training)
            else:
                x = layer.forward(x)
        return x

# ResNet Block
class ResNetBlock:
    def __init__(self, in_channels, out_channels, stride=1):
        self.conv1 = Conv2D(out_channels, 3, stride=stride, padding=1)
        self.bn1 = BatchNormalization(out_channels)
        self.relu = ReLU()
        
        self.conv2 = Conv2D(out_channels, 3, stride=1, padding=1)
        self.bn2 = BatchNormalization(out_channels)
        
        # Shortcut connection
        if stride != 1 or in_channels != out_channels:
            self.shortcut = Conv2D(out_channels, 1, stride=stride, padding=0)
            self.bn_shortcut = BatchNormalization(out_channels)
        else:
            self.shortcut = None
    
    def forward(self, x):
        identity = x
        
        out = self.conv1.forward(x)
        out = self.bn1.forward(out)
        out = self.relu.forward(out)
        
        out = self.conv2.forward(out)
        out = self.bn2.forward(out)
        
        if self.shortcut:
            identity = self.shortcut.forward(x)
            identity = self.bn_shortcut.forward(identity)
        
        out += identity
        out = self.relu.forward(out)
        
        return out
            `
          }
        ],
        
        patterns: [
          {
            name: 'Convolutional Feature Extraction',
            description: 'Use convolutions to extract hierarchical features',
            useCase: 'Image classification, object detection',
            implementation: 'Stack Conv -> Activation -> Pool layers',
            complexity: 'O(K² × C × H × W) per conv layer'
          },
          {
            name: 'Skip Connections (ResNet)',
            description: 'Add input to output to preserve gradient flow',
            useCase: 'Very deep networks',
            implementation: 'output = F(x, W) + x',
            complexity: 'Same as base network'
          },
          {
            name: 'Transfer Learning',
            description: 'Use pre-trained models on new tasks',
            useCase: 'Limited training data',
            implementation: 'Freeze early layers, train final layers',
            complexity: 'Reduces training time significantly'
          }
        ]
      },
      
      problems: [
        {
          id: 'cnn-1',
          title: 'Implement 2D Convolution',
          difficulty: 'Medium',
          description: 'Implement a 2D convolution operation from scratch.',
          solution: `
import numpy as np

def conv2d(image, kernel, stride=1, padding=0):
    # Add padding
    if padding > 0:
        image = np.pad(image, padding, mode='constant')
    
    h, w = image.shape
    kh, kw = kernel.shape
    
    out_h = (h - kh) // stride + 1
    out_w = (w - kw) // stride + 1
    
    output = np.zeros((out_h, out_w))
    
    for i in range(0, out_h):
        for j in range(0, out_w):
            h_start = i * stride
            w_start = j * stride
            region = image[h_start:h_start+kh, w_start:w_start+kw]
            output[i, j] = np.sum(region * kernel)
    
    return output

# Test
image = np.random.randn(28, 28)
kernel = np.random.randn(3, 3)
result = conv2d(image, kernel, stride=1, padding=1)
print(f"Output shape: {result.shape}")
          `
        },
        {
          id: 'cnn-2',
          title: 'Build CNN for MNIST',
          difficulty: 'Medium',
          description: 'Create a CNN to classify MNIST handwritten digits.',
          solution: `
import numpy as np

class MNIST_CNN:
    def __init__(self):
        # Conv layer 1: 1x28x28 -> 32x28x28
        self.conv1_filters = np.random.randn(32, 1, 3, 3) * 0.1
        self.conv1_bias = np.zeros(32)
        
        # Conv layer 2: 32x14x14 -> 64x14x14
        self.conv2_filters = np.random.randn(64, 32, 3, 3) * 0.1
        self.conv2_bias = np.zeros(64)
        
        # FC layer: 64*7*7 -> 128
        self.fc1_weights = np.random.randn(64*7*7, 128) * 0.01
        self.fc1_bias = np.zeros(128)
        
        # Output layer: 128 -> 10
        self.fc2_weights = np.random.randn(128, 10) * 0.01
        self.fc2_bias = np.zeros(10)
    
    def relu(self, x):
        return np.maximum(0, x)
    
    def max_pool(self, x, size=2, stride=2):
        n, c, h, w = x.shape
        out_h = (h - size) // stride + 1
        out_w = (w - size) // stride + 1
        
        out = np.zeros((n, c, out_h, out_w))
        
        for i in range(out_h):
            for j in range(out_w):
                h_start = i * stride
                w_start = j * stride
                region = x[:, :, h_start:h_start+size, w_start:w_start+size]
                out[:, :, i, j] = np.max(region, axis=(2, 3))
        
        return out
    
    def forward(self, x):
        # Conv1 + ReLU + Pool
        # ... implementation
        
        # Conv2 + ReLU + Pool
        # ... implementation
        
        # Flatten
        x = x.reshape(x.shape[0], -1)
        
        # FC1 + ReLU
        x = self.relu(np.dot(x, self.fc1_weights) + self.fc1_bias)
        
        # FC2 (output)
        x = np.dot(x, self.fc2_weights) + self.fc2_bias
        
        # Softmax
        exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
        return exp_x / np.sum(exp_x, axis=1, keepdims=True)
          `
        },
        {
          id: 'cnn-3',
          title: 'Implement Data Augmentation',
          difficulty: 'Easy',
          description: 'Create functions for image data augmentation.',
          solution: `
import numpy as np

class DataAugmentation:
    @staticmethod
    def random_flip(image, horizontal=True):
        if np.random.rand() > 0.5:
            if horizontal:
                return np.fliplr(image)
            else:
                return np.flipud(image)
        return image
    
    @staticmethod
    def random_rotation(image, max_angle=15):
        angle = np.random.uniform(-max_angle, max_angle)
        # Simplified rotation (would use scipy or cv2 in practice)
        return image  # placeholder
    
    @staticmethod
    def random_crop(image, crop_size):
        h, w = image.shape[:2]
        top = np.random.randint(0, h - crop_size[0] + 1)
        left = np.random.randint(0, w - crop_size[1] + 1)
        return image[top:top+crop_size[0], left:left+crop_size[1]]
    
    @staticmethod
    def random_brightness(image, delta=0.2):
        factor = np.random.uniform(1-delta, 1+delta)
        return np.clip(image * factor, 0, 1)
    
    @staticmethod
    def augment(image):
        image = DataAugmentation.random_flip(image)
        image = DataAugmentation.random_brightness(image)
        return image
          `
        }
      ],
      
      lessons: [
        {
          title: 'CNN Architecture',
          duration: '55 min',
          type: 'video',
          content: 'Understanding convolutional layers and feature extraction'
        },
        {
          title: 'Image Processing Techniques',
          duration: '60 min',
          type: 'reading',
          content: 'Convolution, pooling, and modern architectures'
        },
        {
          title: 'Transfer Learning with Pre-trained Models',
          duration: '50 min',
          type: 'video',
          content: 'Using ResNet, VGG, and other pre-trained models'
        },
        {
          title: 'Practice Projects',
          duration: '5 hours',
          type: 'practice',
          content: 'Build image classifiers and object detectors'
        }
      ]
    }
  ]
};

export default aiLearningPath;
