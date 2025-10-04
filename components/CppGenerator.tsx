
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { generateAssemblyStream, AiResponseError } from '../services/geminiService';
import { PerformanceChart } from './PerformanceChart';
import { PipelineVisualizer } from './PipelineVisualizer';

declare global {
  interface Window {
    Prism: {
      highlightAll: () => void;
      highlightElement: (element: Element) => void;
    };
  }
}

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
  </div>
);

const CodeBlockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const textInput = useRef<HTMLDivElement>(null);
    const [isCopied, setIsCopied] = useState(false);

    const onCopy = () => {
        if (textInput.current?.textContent) {
            navigator.clipboard.writeText(textInput.current.textContent);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="relative group h-full" ref={textInput}>
            <button
                onClick={onCopy}
                className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-sans rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                {isCopied ? 'Copied!' : 'Copy'}
            </button>
            {children}
        </div>
    );
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const examples = [
  {
    name: 'NN: Fully Connected Layer',
    code: `// A complete, fully-connected neural network layer.
// This is a core building block of MLPs and CNNs.
// It performs Y = ReLU(W * X + B) where W is a weight matrix,
// X is an input vector, and B is a bias vector.
void dense_layer(float* Y, float* W, float* X, float* B, int M, int N) {
  for (int i = 0; i < M; ++i) {
    float accumulator = B[i]; // Start with the bias
    for (int j = 0; j < N; ++j) {
      // This loop is heavily optimized by the 'mac' instruction
      accumulator += W[i * N + j] * X[j];
    }
    // The final result is passed through a ReLU activation
    // which is optimized by the 'relu' instruction.
    Y[i] = (accumulator > 0.0) ? accumulator : 0.0;
  }
}`
  },
  {
    name: 'NN: 3x3 Convolution',
    code: `// Simplified 2D Convolution with a 3x3 kernel.
// Replaced by a single 'conv2d.3x3' instruction.
float conv2d_3x3(float* input, float* kernel, int input_stride) {
  float output = 0.0;
  for (int i = 0; i < 3; ++i) {
    for (int j = 0; j < 3; ++j) {
      output += input[i * input_stride + j] * kernel[i * 3 + j];
    }
  }
  return output;
}`
  },
    {
    name: 'NN: 3x3 Depthwise Conv',
    code: `// 3x3 Depthwise Convolution, common in efficient networks.
// Replaced by a single 'dwconv.3x3' instruction.
float dw_conv2d_3x3(float* input, float* kernel, int stride) {
  float output = 0.0;
  for (int i = 0; i < 3; ++i) {
    for (int j = 0; j < 3; ++j) {
      output += input[i * stride + j] * kernel[i * 3 + j];
    }
  }
  return output;
}`
  },
  {
    name: 'NN: 2x2 Max Pooling',
    code: `// 2x2 Max Pooling with a stride of 2.
// Replaced by a single 'maxpool.2x2' instruction.
float max_pool_2x2(float* input, int stride) {
  float m0 = input[0];
  float m1 = input[1];
  float m2 = input[stride];
  float m3 = input[stride+1];
  float max_val = m0 > m1 ? m0 : m1;
  float max_val2 = m2 > m3 ? m2 : m3;
  return max_val > max_val2 ? max_val : max_val2;
}`
  },
   {
    name: 'NN: Batch Normalization',
    code: `// Applies Batch Normalization to a single value.
// gamma * (x - mean) / sqrt(variance + epsilon) + beta
// This is compiled using standard FPU instructions.
float batch_norm(float x, float mean, float variance, float gamma, float beta) {
  const float epsilon = 1e-5f;
  float inv_stddev = 1.0f / sqrtf(variance + epsilon);
  return gamma * (x - mean) * inv_stddev + beta;
}`
  },
  {
    name: 'NN: Sigmoid Activation',
    code: `// Applies the Sigmoid function element-wise to a vector.
// Optimized with a single 'sigmoid' instruction.
void sigmoid_vec(float* B, float* A, int N) {
  for (int i = 0; i < N; ++i) {
    B[i] = 1.0f / (1.0f + expf(-A[i]));
  }
}`
  },
  {
    name: 'NN: Tanh Activation',
    code: `// Applies the Tanh function element-wise to a vector.
// Optimized with a single 'tanh' instruction.
void tanh_vec(float* B, float* A, int N) {
  for (int i = 0; i < N; ++i) {
    B[i] = tanhf(A[i]);
  }
}`
  },
   {
    name: 'NN: Leaky ReLU Activation',
    code: `// Leaky ReLU activation function.
// This uses standard FPU instructions.
void leaky_relu_vec(float* B, float* A, int N, float alpha) {
  for (int i = 0; i < N; ++i) {
    B[i] = (A[i] > 0.0f) ? A[i] : A[i] * alpha;
  }
}`
  },
  {
    name: 'Vector: Dot Product',
    code: `// Dot Product of two vectors.
// Optimized with 'mac' instructions.
float dot_product(float* A, float* B, int N) {
  float result = 0.0;
  for (int i = 0; i < N; ++i) {
    result += A[i] * B[i];
  }
  return result;
}`
  },
  {
    name: 'Vector: SAXPY',
    code: `// Single-Precision A*X + Y (SAXPY).
// A core routine in linear algebra (BLAS).
// Optimized with 'mac' instructions.
void saxpy(float* Y, float* X, float a, int N) {
  for (int i = 0; i < N; ++i) {
    Y[i] = a * X[i] + Y[i];
  }
}`
  },
  {
    name: 'Vector: Sum of Squares',
    code: `// Calculates the sum of squares of a vector's elements.
// Optimized with 'mac' instructions.
float sum_of_squares(float* A, int N) {
  float result = 0.0;
  for (int i = 0; i < N; ++i) {
    result += A[i] * A[i];
  }
  return result;
}`
  },
  {
    name: 'Vector: L2 Norm',
    code: `// Calculates the L2 Norm (Euclidean length) of a vector.
// This is sqrt(sum_of_squares).
// Uses standard FPU instructions.
float l2_norm(float* A, int N) {
  float ss = 0.0;
  for (int i = 0; i < N; ++i) {
    ss += A[i] * A[i]; // Optimized with MAC
  }
  return sqrtf(ss);
}`
  },
   {
    name: 'Vector: Addition',
    code: `// Adds two vectors element-wise.
// Uses standard FPU fadd.s instructions.
void vector_add(float* C, float* A, float* B, int N) {
  for (int i = 0; i < N; ++i) {
    C[i] = A[i] + B[i];
  }
}`
  },
  {
    name: 'Vector: Scaling',
    code: `// Scales a vector by a constant factor.
// Uses standard FPU fmul.s instructions.
void vector_scale(float* B, float* A, float scalar, int N) {
  for (int i = 0; i < N; ++i) {
    B[i] = A[i] * scalar;
  }
}`
  },
  {
    name: 'Matrix: 5x5 Convolution',
    code: `// 2D Convolution with a 5x5 kernel.
// Implemented with a loop of 'mac' instructions.
float conv2d_5x5(float* input, float* kernel, int stride) {
  float output = 0.0;
  for (int i = 0; i < 5; ++i) {
    for (int j = 0; j < 5; ++j) {
      output += input[i * stride + j] * kernel[i * 5 + j];
    }
  }
  return output;
}`
  },
   {
    name: 'Matrix: Transpose (4x4)',
    code: `// Transposes a 4x4 matrix.
// Uses standard load/store instructions.
void transpose_4x4(float* dst, float* src) {
  for (int i = 0; i < 4; ++i) {
    for (int j = 0; j < 4; ++j) {
      dst[j * 4 + i] = src[i * 4 + j];
    }
  }
}`
  },
  {
    name: 'Matrix: Matrix-Vector Multiply',
    code: `// Matrix-Vector Multiplication with ReLU
// C = A * B, then C = ReLU(C)
// Optimized with 'mac' and 'relu' instructions.
void mat_vec_relu(float* C, float* A, float* B, int M, int N) {
  for (int i = 0; i < M; ++i) {
    float sum = 0.0;
    for (int j = 0; j < N; ++j) {
      sum += A[i * N + j] * B[j];
    }
    C[i] = (sum > 0.0) ? sum : 0.0;
  }
}`
  },
  {
    name: 'DSP: FIR Filter',
    code: `// Finite Impulse Response (FIR) Filter.
// A fundamental operation in digital signal processing.
// Optimized with 'mac' instructions.
float fir_filter(float* signal, float* coeffs, int length) {
  float output = 0.0;
  for (int i = 0; i < length; ++i) {
    output += signal[i] * coeffs[i];
  }
  return output;
}`
  },
  {
    name: 'DSP: Moving Average',
    code: `// Simple moving average filter.
// Uses standard FPU fadd.s and fdiv.s.
float moving_average(float* signal, int window_size) {
  float sum = 0.0;
  for (int i = 0; i < window_size; ++i) {
    sum += signal[i];
  }
  return sum / (float)window_size;
}`
  },
  {
    name: 'Image: Grayscale Conversion',
    code: `// Converts an RGB pixel to grayscale using luminosity method.
// Uses standard FPU instructions.
float rgb_to_gray(float r, float g, float b) {
  return 0.299f * r + 0.587f * g + 0.114f * b;
}`
  },
  {
    name: 'Image: Sobel Operator (X)',
    code: `// Applies a 3x3 Sobel kernel for horizontal edge detection.
// This is a specialized convolution, optimized with 'conv2d.3x3'.
float sobel_x(float* image_patch, int stride) {
  const float kernel[9] = { -1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0 };
  float result = 0.0;
  for (int i = 0; i < 3; ++i) {
    for (int j = 0; j < 3; ++j) {
      result += image_patch[i * stride + j] * kernel[i * 3 + j];
    }
  }
  return result;
}`
  },
  {
    name: 'Math: Polynomial Eval',
    code: `// Evaluates a 3rd degree polynomial using Horner's method.
// P(x) = c3*x^3 + c2*x^2 + c1*x + c0
// Optimized with 'mac' instructions.
float poly_eval(float x, float* c) {
  float result = c[3];
  result = result * x + c[2];
  result = result * x + c[1];
  result = result * x + c[0];
  return result;
}`
  },
  {
    name: 'Math: Vector Interpolation',
    code: `// Linear interpolation between two vectors.
// C = A * (1-t) + B * t
// Uses standard FPU instructions.
void lerp_vec(float* C, float* A, float* B, float t, int N) {
  float one_minus_t = 1.0f - t;
  for (int i = 0; i < N; ++i) {
    C[i] = A[i] * one_minus_t + B[i] * t;
  }
}`
  },
  {
    name: 'Sort: Find Max Value',
    code: `// Finds the maximum value in a float array.
// Uses standard FPU fgt.s and branch instructions.
float find_max(float* A, int N) {
  float max_val = A[0];
  for (int i = 1; i < N; ++i) {
    if (A[i] > max_val) {
      max_val = A[i];
    }
  }
  return max_val;
}`
  },
    {
    name: 'Sort: Bubble Sort Pass',
    code: `// Performs a single pass of a bubble sort.
// Uses standard FPU fgt.s, fmv.s, and branch instructions.
void bubble_sort_pass(float* A, int N) {
  for (int i = 0; i < N - 1; ++i) {
    if (A[i] > A[i+1]) {
      float temp = A[i];
      A[i] = A[i+1];
      A[i+1] = temp;
    }
  }
}`
  },
  {
    name: 'Stats: Mean Calculation',
    code: `// Calculates the mean of a vector.
// Uses standard FPU fadd.s and fdiv.s.
float mean(float* A, int N) {
  float sum = 0.0;
  for (int i = 0; i < N; ++i) {
    sum += A[i];
  }
  return sum / (float)N;
}`
  },
  {
    name: 'Stats: Variance Calculation',
    code: `// Calculates the variance of a vector.
// Optimized with 'mac' instructions for sum of squares.
float variance(float* A, float mean, int N) {
  float sum_sq_diff = 0.0;
  for (int i = 0; i < N; ++i) {
    float diff = A[i] - mean;
    sum_sq_diff += diff * diff;
  }
  return sum_sq_diff / (float)N;
}`
  },
];

const MAX_CODE_LENGTH = 4096;

export const CppGenerator: React.FC = () => {
    const [activeExample, setActiveExample] = useState(examples[0].name);
    const [customCode, setCustomCode] = useState(examples[0].code);
    const [assemblyCode, setAssemblyCode] = useState('');
    const [streamingOutput, setStreamingOutput] = useState('');
    const [instructionCount, setInstructionCount] = useState<{ standard: number; custom: number } | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const codeBlockRef = useRef<HTMLElement>(null);
    const debouncedCustomCode = useDebounce(customCode, 300);

    useEffect(() => {
        if (isLoading || !assemblyCode || !codeBlockRef.current || !window.Prism) return;
        window.Prism.highlightElement(codeBlockRef.current);
    }, [assemblyCode, isLoading]);

    useEffect(() => {
        const validate = (code: string): string | null => {
        if (code.length > MAX_CODE_LENGTH) return `Error: Code exceeds maximum length of ${MAX_CODE_LENGTH} characters.`;
        if (/<script/i.test(code)) return 'Error: Input contains invalid patterns (e.g., <script>). Please remove them.';
        const stack: { char: string; line: number }[] = [];
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (['(', '{', '['].includes(char)) stack.push({ char, line: i + 1 });
            else if ([')', '}', ']'].includes(char)) {
                if (stack.length === 0) return `Syntax Error: Unmatched closing bracket '${char}' on line ${i + 1}.`;
                const lastOpen = stack.pop()!;
                if ((char === ')' && lastOpen.char !== '(') || (char === '}' && lastOpen.char !== '{') || (char === ']' && lastOpen.char !== '[')) {
                return `Syntax Error: Mismatched bracket. Expected closing for '${lastOpen.char}' from line ${lastOpen.line}, but found '${char}' on line ${i + 1}.`;
                }
            }
            }
        }
        if (stack.length > 0) {
            const lastOpen = stack[stack.length - 1];
            return `Syntax Error: Unclosed bracket '${lastOpen.char}' from line ${lastOpen.line}.`;
        }
        return null;
        };
        setValidationError(validate(debouncedCustomCode));
    }, [debouncedCustomCode]);

    const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const example = examples.find(ex => ex.name === e.target.value);
        if (example) {
        setActiveExample(example.name);
        setCustomCode(example.code);
        setAssemblyCode('');
        setStreamingOutput('');
        setError(null);
        setInstructionCount(null);
        setShowVisualizer(false);
        }
    };

    const handleGenerate = useCallback(async () => {
        if (validationError) return;
        setIsLoading(true);
        setError(null);
        setAssemblyCode('');
        setStreamingOutput('');
        setInstructionCount(null);
        setShowVisualizer(false);
        let fullResponseText = '';
        try {
        const stream = generateAssemblyStream(customCode);
        for await (const chunk of stream) {
            fullResponseText += chunk;
            setStreamingOutput(fullResponseText);
        }
        const result = JSON.parse(fullResponseText);
        if (!result || typeof result.assemblyCode !== 'string' || typeof result.instructionCount !== 'object' || result.instructionCount === null || typeof result.instructionCount.standard !== 'number' || typeof result.instructionCount.custom !== 'number') {
            throw new AiResponseError("The AI service returned a response with an unexpected structure.");
        }
        setAssemblyCode(result.assemblyCode);
        setInstructionCount(result.instructionCount);
        } catch (e) {
        if (e instanceof AiResponseError) {
            setError(`The AI service returned an invalid response. This can happen with incomplete or ambiguous code. Please ensure your code is a complete, well-defined function or snippet.`);
        } else {
            setError(`Failed to generate assembly. The AI model could not be reached or failed to process the request. Please check your connection and try again.`);
        }
        console.error(e);
        setAssemblyCode('');
        } finally {
        setIsLoading(false);
        setStreamingOutput('');
        }
    }, [customCode, validationError]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const { selectionStart, selectionEnd, value } = textarea;
        if (e.key === 'Tab') {
        e.preventDefault();
        const newValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
        setCustomCode(newValue);
        setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = selectionStart + 2; }, 0);
        } else if (e.key === 'Enter') {
        e.preventDefault();
        const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const currentLine = value.substring(currentLineStart, selectionStart);
        const indentationMatch = currentLine.match(/^\s*/);
        const indentation = indentationMatch ? indentationMatch[0] : '';
        const newValue = value.substring(0, selectionStart) + '\n' + indentation + value.substring(selectionEnd);
        setCustomCode(newValue);
        setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indentation.length; }, 0);
        }
    };

    return (
        <div className="animate-fade-in" style={{animationDuration: '0.3s'}}>
          <p className="text-slate-400 mb-4">
            Select a C++ code example or write your own to see how it's translated into our custom RISC-V assembly. The AI compiler will automatically apply optimizations and use the custom ISA extensions where possible.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <label htmlFor="example-select" className="block text-sm font-medium text-slate-300 mb-2">Select an Example</label>
                <select id="example-select" value={activeExample} onChange={handleExampleChange} className="w-full p-3 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors">
                  {examples.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="cpp-code" className="block text-sm font-medium text-slate-300 mb-2">Custom C++ Code</label>
                <textarea id="cpp-code" value={customCode} onChange={(e) => setCustomCode(e.target.value)} onKeyDown={handleKeyDown} className={`w-full h-[400px] p-3 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border focus:outline-none focus:ring-2 transition-colors ${validationError ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-cyan-500'}`} spellCheck="false" aria-invalid={!!validationError} aria-describedby={validationError ? "validation-error" : undefined} />
                {validationError && <p id="validation-error" className="mt-2 text-sm text-red-400" role="alert">{validationError}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="asm-output" className="block text-sm font-medium text-slate-300 mb-2">Generated Assembly Output</label>
              <div id="asm-output" className="w-full h-[510px] bg-slate-900 text-slate-100 rounded-md border border-slate-600 overflow-y-auto">
                {isLoading ? (
                  <pre className="language-json !bg-transparent !p-0 h-full"><code className="language-json h-full block p-3 whitespace-pre-wrap">{streamingOutput || <LoadingSpinner />}</code></pre>
                ) : error ? (
                  <div className="text-red-400 p-4 whitespace-pre-wrap">{error}</div>
                ) : assemblyCode ? (
                  <CodeBlockWrapper>
                    <pre className="language-riscv !bg-transparent !p-0 !mt-0 !mb-0"><code ref={codeBlockRef} className="language-riscv block p-3">{assemblyCode}</code></pre>
                  </CodeBlockWrapper>
                ) : (
                  <div className="text-slate-500 p-4">Generated assembly will appear here.</div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <button onClick={handleGenerate} disabled={isLoading || !customCode || !!validationError} className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:scale-100">
              {isLoading ? 'Generating...' : 'Generate Assembly'}
            </button>
          </div>
          {instructionCount && !isLoading && !error &&
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4 text-center">Instruction Count Comparison</h3>
              <p className="text-slate-400 mb-4 max-w-2xl mx-auto text-center">This chart illustrates the estimated reduction in dynamic instruction count for the core logic, comparing a standard RISC-V implementation against our custom ISA.</p>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <PerformanceChart data={instructionCount} />
              </div>
            </div>
          }
          {assemblyCode && !isLoading && !error && (
            <div className="mt-8 border-t border-slate-700 pt-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-100 mb-4">Pipeline Simulation</h3>
                <p className="text-slate-400 max-w-3xl mx-auto">The generated assembly code can be simulated in our 5-stage pipeline visualizer. Click the button below to see how the code executes cycle-by-cycle and observe potential pipeline hazards like stalls and flushes. You can even edit the code inside the simulator and re-run it.</p>
              </div>
              <div className="text-center">
                <button onClick={() => setShowVisualizer(s => !s)} className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-cyan-700 transition-all duration-300 hover:scale-105">
                  {showVisualizer ? 'Hide Pipeline Simulation' : 'Simulate Generated Code'}
                </button>
              </div>
              {showVisualizer && (
                <div className="mt-8 p-6 bg-slate-900/50 rounded-lg border border-slate-600 animate-fade-in">
                  <PipelineVisualizer initialCode={assemblyCode} isEmbedded={true} />
                </div>
              )}
            </div>
          )}
        </div>
    );
};
