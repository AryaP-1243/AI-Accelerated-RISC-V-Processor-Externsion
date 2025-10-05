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

type Example = {
    name: string;
    code: string;
};

type ExampleCategory = {
    category: string;
    examples: Example[];
};

const examples: ExampleCategory[] = [
  {
    category: "Basic & Arithmetic",
    examples: [
      { name: "Sum Integers N to M", code: `int sum_range(int n, int m) {\n  int sum = 0;\n  for (int i = n; i <= m; ++i) sum += i;\n  return sum;\n}` },
      { name: "Factorial (Loop)", code: `int factorial(int n) {\n  int res = 1;\n  for (int i = 2; i <= n; ++i) res *= i;\n  return res;\n}` },
      { name: "Conditional Max Function", code: `int max_func(int a, int b) {\n  return a > b ? a : b;\n}` },
      { name: "Switch Case Generator", code: `int get_value(int key) {\n  switch(key) {\n    case 1: return 100;\n    case 2: return 200;\n    case 3: return 300;\n    default: return -1;\n  }\n}` },
      { name: "Bitwise Count Set Bits", code: `int countSetBits(int n) {\n  int count = 0;\n  while (n > 0) {\n    n &= (n - 1);\n    count++;\n  }\n  return count;\n}` },
      { name: "Recursive Fibonacci", code: `int fibonacci(int n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}` },
      { name: "Pointer Dereference & Add", code: `void add_to_value(int* p_value, int to_add) {\n  *p_value += to_add;\n}` },
      { name: "Simple Array Sum", code: `int sum_array(int* arr, int size) {\n  int total = 0;\n  for (int i = 0; i < size; ++i) {\n    total += arr[i];\n  }\n  return total;\n}` },
      { name: "Floating Point Sqrt", code: `float fp_sqrt(float num) {\n  return __builtin_sqrtf(num);\n}` },
      { name: "Integer Division Function", code: `int divide(int a, int b) {\n  return a / b;\n}` },
      { name: "Modulo Operation", code: `int modulo(int a, int b) {\n  return a % b;\n}` },
      { name: "Bitwise Rotate Right", code: `unsigned int ror(unsigned int val, int shift) {\n  return (val >> shift) | (val << (32 - shift));\n}` },
      { name: "Array Copy Function", code: `void copy_array(int* dst, int* src, int size) {\n  for (int i = 0; i < size; ++i) {\n    dst[i] = src[i];\n  }\n}` },
      { name: "Vector-Scalar Multiply", code: `void vsmul(float* v, float s, int size) {\n  for (int i = 0; i < size; ++i) {\n    v[i] *= s;\n  }\n}` },
      { name: "Absolute Value Function", code: `int absolute(int n) {\n  return (n < 0) ? -n : n;\n}` },
      { name: "Unsigned Integer Max", code: `unsigned int umax(unsigned int a, unsigned int b) {\n  return (a > b) ? a : b;\n}` },
      { name: "Compare Two Strings", code: `int string_compare(const char* s1, const char* s2) {\n  while (*s1 && (*s1 == *s2)) {\n    s1++;\n    s2++;\n  }\n  return *(const unsigned char*)s1 - *(const unsigned char*)s2;\n}` },
      { name: "Compute Modulo N", code: `int compute_mod_n(int val, int n) {\n  return val % n;\n}` },
      { name: "Simple Matrix Transpose", code: `void transpose(float* dst, float* src, int w, int h) {\n  for (int i = 0; i < h; ++i) {\n    for (int j = 0; j < w; ++j) {\n      dst[j * h + i] = src[i * w + j];\n    }\n  }\n}` },
      { name: "Invert Bits Function", code: `unsigned int invert_bits(unsigned int n) {\n  return ~n;\n}` },
    ]
  },
  {
    category: "Control Flow & Memory Access",
    examples: [
      { name: "Multi-Level Nested Loop", code: `int nested_loop_sum(int d1, int d2, int d3) {\n  int sum = 0;\n  for(int i=0; i<d1; ++i)\n    for(int j=0; j<d2; ++j)\n      for(int k=0; k<d3; ++k)\n        sum++;\n  return sum;\n}` },
      { name: "Unrolled Loop For Array Sum", code: `int sum_array_unrolled(int* arr, int size) {\n  int sum = 0;\n  for (int i=0; i<size; i+=4) {\n    sum += arr[i];\n    sum += arr[i+1];\n    sum += arr[i+2];\n    sum += arr[i+3];\n  }\n  return sum;\n}` },
      { name: "Memset Function", code: `void my_memset(void* ptr, int value, int num) {\n  unsigned char* p = (unsigned char*)ptr;\n  for (int i = 0; i < num; ++i) {\n    p[i] = (unsigned char)value;\n  }\n}` },
      { name: "Custom Memcpy", code: `void my_memcpy(void* dst, const void* src, int num) {\n  char* d = (char*)dst;\n  const char* s = (const char*)src;\n  for (int i=0; i<num; ++i) d[i] = s[i];\n}` },
      { name: "Stack-Based Local Variables", code: `int stack_vars() {\n  int a = 5;\n  int b = 10;\n  int c = a + b;\n  return c * 2;\n}` },
      { name: "Efficient Memory Init", code: `void init_mem(int* mem, int size) {\n  for (int i = 0; i < size; ++i) mem[i] = i;\n}` },
      { name: "Function Pointer Call", code: `int add(int a, int b) { return a+b; }\nint exec(int (*func)(int, int), int a, int b) {\n  return func(a, b);\n}` },
      { name: "Branch Prediction Optimization", code: `int count_positives(int* arr, int size) {\n  int count = 0;\n  for (int i = 0; i < size; ++i) {\n    if (arr[i] > 0) count++; // This branch can be unpredictable\n  }\n  return count;\n}` },
      { name: "Data Structure Access", code: `struct Point { int x, y; };\nint get_dist_sq(struct Point* p) {\n  return p->x * p->x + p->y * p->y;\n}` },
      { name: "Volatile Memory Access", code: `void wait_on_flag(volatile int* flag) {\n  while (*flag == 0) { /* wait */ }\n}` },
      { name: "Loop Unrolling For Speed", code: `void unroll_speed(float* a, float* b, int n) {\n  for(int i=0; i<n; i+=2) {\n    a[i] = b[i] * 2.0f;\n    a[i+1] = b[i+1] * 2.0f;\n  }\n}` },
      { name: "Conditional Jump Optimization", code: `int conditional_jump(int a, int b) {\n  if (a > b) return a;\n  else return b;\n}` },
      { name: "Inline Assembly Example", code: `int inline_asm() {\n  int a=10, b=20, sum;\n  // This is a conceptual example for the compiler\n  // to demonstrate understanding of inline assembly.\n  __asm__ ("add %0, %1, %2" : "=r"(sum) : "r"(a), "r"(b));\n  return sum;\n}` },
      { name: "Simple Function Call Graph", code: `int func_b(int x) { return x * 2; }\nint func_a(int x) { return func_b(x) + 5; }` },
      { name: "Cache Line Prefetch Optimization", code: `void prefetch_opt(int* data, int size) {\n  for (int i=0; i<size; ++i) {\n    // Conceptually, prefetch data for future iterations\n    __builtin_prefetch(&data[i+16], 0, 3);\n    data[i] *= 2;\n  }\n}` },
      { name: "Generate Jump Table For Switch", code: `int jump_table(int x) {\n  switch(x) {\n    case 0: return 10;\n    case 1: return 20;\n    case 2: return 30;\n    case 3: return 40;\n    default: return 0;\n  }\n}` },
      { name: "Pointer Arithmetic Loop", code: `int sum_ptr_arith(int* arr, int size) {\n  int sum = 0;\n  int* end = arr + size;\n  while(arr < end) {\n    sum += *arr++;\n  }\n  return sum;\n}` },
      { name: "String Search Function", code: `const char* find_char(const char* s, char c) {\n  while(*s != '\\0') {\n    if (*s == c) return s;\n    s++;\n  }\n  return 0;\n}` },
      { name: "Data Prefetching For Large Array", code: `void prefetch_large(float* a, float* b, int n) {\n  for (int i=0; i<n; ++i) {\n    __builtin_prefetch(&b[i+128], 0, 3);\n    a[i] = b[i] * 3.14f;\n  }\n}` },
      { name: "Optimized Stack Push/Pop", code: `int func_with_stack() {\n  int x = 1, y = 2, z = 3;\n  return x+y+z;\n}` },
    ]
  },
  {
    category: "AI/ML-Specific Assembly",
    examples: [
      { name: "Conv2d 3x3 (Int8)", code: `// 3x3 convolution on an 8-bit image patch.\n// This loop will be replaced by a single 'conv2d.3x3' instruction.\nint conv2d_3x3_i8(char* input, char* kernel, int stride) {\n  int sum = 0;\n  for(int i=0; i<3; ++i) {\n    for(int j=0; j<3; ++j) {\n      sum += input[i*stride + j] * kernel[i*3 + j];\n    }\n  }\n  return sum;\n}` },
      { name: "Conv2d 3x3 (Float16)", code: `// 3x3 convolution on a 16-bit float image patch.\n// This will be replaced by a single 'conv2d.3x3' instruction.\nfloat conv2d_3x3_f16(_Float16* input, _Float16* kernel, int stride) {\n  float sum = 0.0f;\n  for(int i=0; i<3; ++i) {\n    for(int j=0; j<3; ++j) {\n      sum += input[i*stride + j] * kernel[i*3 + j];\n    }\n  }\n  return sum;\n}` },
      { name: "MatrixMultiply 8x8 (Int8)", code: `// 8x8 integer matrix multiplication.\n// Optimized to use a loop of 'mac' instructions.\nvoid matmul_8x8_i8(char* C, char* A, char* B) {\n  for(int i=0; i<8; ++i) {\n    for(int j=0; j<8; ++j) {\n      int sum = 0;\n      for(int k=0; k<8; ++k) sum += A[i*8+k] * B[k*8+j];\n      C[i*8+j] = (char)sum;\n    }\n  }\n}` },
      { name: "MatrixMultiply 16x16 (Float16)", code: `// 16x16 float16 matrix multiplication.\n// Optimized to use a loop of 'mac' instructions.\nvoid matmul_16x16_f16(_Float16* C, _Float16* A, _Float16* B) {\n  for(int i=0; i<16; ++i) {\n    for(int j=0; j<16; ++j) {\n      float sum = 0.0f;\n      for(int k=0; k<16; ++k) sum += A[i*16+k] * B[k*16+j];\n      C[i*16+j] = (_Float16)sum;\n    }\n  }\n}` },
      { name: "Vector Dot Product", code: `// Dot product of two float vectors.\n// Optimized to use 'mac' instructions.\nfloat dot_product(float* a, float* b, int n) {\n  float sum = 0.0f;\n  for (int i=0; i<n; ++i) sum += a[i] * b[i];\n  return sum;\n}` },
      { name: "ReLU Vector (Int8)", code: `// ReLU activation on a vector of 8-bit integers.\n// Optimized to use a loop of 'relu' instructions.\nvoid relu_vec_i8(char* data, int n) {\n  for (int i=0; i<n; ++i) {\n    if (data[i] < 0) data[i] = 0;\n  }\n}` },
      { name: "ReLU Vector (Float16)", code: `// ReLU activation on a vector of 16-bit floats.\n// Optimized to use a loop of 'relu' instructions.\nvoid relu_vec_f16(_Float16* data, int n) {\n  for (int i=0; i<n; ++i) {\n    if (data[i] < 0.0f) data[i] = 0.0f;\n  }\n}` },
      { name: "LeakyReLU Vector", code: `// Leaky ReLU activation function.\nvoid leaky_relu_vec(float* data, float alpha, int n) {\n  for (int i=0; i<n; ++i) {\n    data[i] = data[i] < 0 ? data[i] * alpha : data[i];\n  }\n}` },
      { name: "Sigmoid Approx Vector", code: `// Sigmoid activation on a vector.\n// Optimized to use 'sigmoid' instructions.\nvoid sigmoid_vec(float* data, int n) {\n  for (int i=0; i<n; ++i) {\n    data[i] = 1.0f / (1.0f + __builtin_expf(-data[i]));\n  }\n}` },
      { name: "Tanh Approx Vector", code: `// Tanh activation on a vector.\n// Optimized to use 'tanh' instructions.\nvoid tanh_vec(float* data, int n) {\n  for (int i=0; i<n; ++i) {\n    data[i] = __builtin_tanhf(data[i]);\n  }\n}` },
      { name: "MaxPool 2x2 (Int8)", code: `// 2x2 Max Pooling for 8-bit integers.\n// Replaced by a single 'maxpool.2x2' instruction.\nchar maxpool_2x2_i8(char* input, int stride) {\n  char m0 = input[0];\n  char m1 = input[1];\n  char m2 = input[stride];\n  char m3 = input[stride+1];\n  char max1 = m0 > m1 ? m0 : m1;\n  char max2 = m2 > m3 ? m2 : m3;\n  return max1 > max2 ? max1 : max2;\n}` },
      { name: "AveragePool 2x2", code: `// 2x2 Average Pooling.\nint avgpool_2x2_i8(char* input, int stride) {\n  return (input[0] + input[1] + input[stride] + input[stride+1]) / 4;\n}` },
      { name: "BatchNormalization (Int8)", code: `// Batch Normalization for 8-bit integers.\nvoid batch_norm_i8(char* data, int scale, int offset, int n) {\n  for (int i=0; i<n; ++i) {\n    data[i] = (data[i] * scale) + offset;\n  }\n}` },
      { name: "Quantization (Int16 to Int8)", code: `// Quantization from 16-bit to 8-bit integers by right-shifting.\nvoid quantize_i16_i8(char* dst, short* src, int shift, int n) {\n  for (int i=0; i<n; ++i) {\n    dst[i] = (char)(src[i] >> shift);\n  }\n}` },
      { name: "Dequantization (Int8 to Float)", code: `// Dequantization from 8-bit integer to float.\nvoid dequantize_i8_f32(float* dst, char* src, float scale, int n) {\n  for (int i=0; i<n; ++i) {\n    dst[i] = (float)src[i] * scale;\n  }\n}` },
      { name: "Softmax Approx Vector", code: `// Softmax activation function.\nvoid softmax(float* data, int n) {\n  float max_val = data[0];\n  for (int i=1; i<n; ++i) if(data[i] > max_val) max_val = data[i];\n  float sum = 0.0f;\n  for (int i=0; i<n; ++i) {\n    data[i] = __builtin_expf(data[i] - max_val);\n    sum += data[i];\n  }\n  for (int i=0; i<n; ++i) data[i] /= sum;\n}` },
      { name: "FullyConnectedLayer (Int8)", code: `// A fully connected layer with 8-bit integers.\nvoid fc_layer_i8(char* out, char* in, char* weights, int in_len, int out_len) {\n  for (int o=0; o<out_len; ++o) {\n    int sum = 0;\n    for(int i=0; i<in_len; ++i) sum += in[i] * weights[o*in_len+i];\n    out[o] = (char)sum;\n  }\n}` },
      { name: "ElementwiseAdd Vector", code: `// Element-wise addition of two vectors.\nvoid add_vec(float* dst, float* src1, float* src2, int n) {\n  for (int i=0; i<n; ++i) dst[i] = src1[i] + src2[i];\n}` },
      { name: "ElementwiseMultiply Vector", code: `// Element-wise multiplication of two vectors.\nvoid mul_vec(float* dst, float* src1, float* src2, int n) {\n  for (int i=0; i<n; ++i) dst[i] = src1[i] * src2[i];\n}` },
      { name: "LoadWeights From Memory", code: `// A routine to load weights from main memory into a local buffer.\nvoid load_weights(float* local_buf, float* main_mem, int n) {\n  for(int i=0; i<n; ++i) local_buf[i] = main_mem[i];\n}` },
      { name: "BiasAddition Vector", code: `// Adds a bias vector to another vector.\nvoid add_bias(float* data, float* bias, int n) {\n  for(int i=0; i<n; ++i) data[i] += bias[i];\n}` },
      { name: "Fused Conv-ReLU", code: `// A fused operation of 3x3 convolution and ReLU.\n// Compiler optimizes this to a 'conv2d.3x3' followed by 'relu'.\nfloat conv_relu_fused(float* input, float* kernel, int stride) {\n  float sum = 0.0f;\n  for(int i=0; i<3; ++i) \n    for(int j=0; j<3; ++j) \n      sum += input[i*stride+j] * kernel[i*3+j];\n  return sum > 0 ? sum : 0;\n}` },
      { name: "Fused MatrixMultiply-Bias", code: `// Fused matrix-vector multiply and bias addition.\nvoid matvec_bias(float* out, float* mat, float* vec, float* bias, int R, int C) {\n  for (int i=0; i<R; ++i) {\n    float sum = bias[i];\n    for (int j=0; j<C; ++j) sum += mat[i*C+j] * vec[j];\n    out[i] = sum;\n  }\n}` },
      { name: "AssemblyForGEMM", code: `// General Matrix Multiplication (GEMM).\nvoid gemm(float* C, float* A, float* B, int M, int N, int K) {\n  for (int i=0; i<M; ++i)\n    for (int j=0; j<K; ++j) {\n      C[i*K+j] = 0;\n      for (int l=0; l<N; ++l)\n        C[i*K+j] += A[i*N+l] * B[l*K+j];\n    }\n}` },
      { name: "AssemblyForImageResizing", code: `// Simple nearest-neighbor image resizing.\nvoid resize_nn(char* dst, char* src, int sw, int sh, int dw, int dh) {\n  float x_ratio = (float)sw / dw;\n  float y_ratio = (float)sh / dh;\n  for (int i=0; i<dh; ++i) {\n    for (int j=0; j<dw; ++j) {\n      int px = (int)(j * x_ratio);\n      int py = (int)(i * y_ratio);\n      dst[i*dw+j] = src[py*sw+px];\n    }\n  }\n}` },
      { name: "AssemblyForRMSNorm", code: `// RMS Normalization layer.\nvoid rms_norm(float* o, float* x, float* w, int n) {\n  float ss = 0.0f;\n  for(int j=0; j<n; ++j) ss += x[j] * x[j];\n  ss = ss/n + 1e-5f;\n  ss = 1.0f / __builtin_sqrtf(ss);\n  for(int j=0; j<n; ++j) o[j] = w[j] * (ss * x[j]);\n}` },
      { name: "AssemblyForLayerNorm", code: `// Layer Normalization.\nvoid layer_norm(float* o, float* x, float* w, float* b, int n) {\n  float mean = 0.0f;\n  for(int j=0; j<n; ++j) mean += x[j];\n  mean /= n;\n  float variance = 0.0f;\n  for(int j=0; j<n; ++j) variance += (x[j]-mean)*(x[j]-mean);\n  variance /= n;\n  float inv_std = 1.0f / __builtin_sqrtf(variance + 1e-5f);\n  for(int j=0; j<n; ++j) o[j] = w[j] * (x[j]-mean) * inv_std + b[j];\n}` },
    ]
  },
];


const findExample = (name: string): Example | undefined => {
    for (const category of examples) {
        const example = category.examples.find(ex => ex.name === name);
        if (example) return example;
    }
    return undefined;
};


const MAX_CODE_LENGTH = 4096;

export const CppGenerator: React.FC = () => {
    const [activeExample, setActiveExample] = useState(examples[0].examples[0].name);
    const [customCode, setCustomCode] = useState(examples[0].examples[0].code);
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
        if (e.target.value === "Custom Code") {
            setActiveExample("Custom Code");
            setCustomCode('');
            setAssemblyCode('');
            setStreamingOutput('');
            setError(null);
            setInstructionCount(null);
            setShowVisualizer(false);
            return;
        }

        const example = findExample(e.target.value);
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
            This AI-powered compiler translates C++ code into our custom RISC-V assembly. It automatically recognizes patterns that can be accelerated by the custom hardware instructions (like `conv2d.3x3` or `mac`). Select a C++ example or write your own to see the optimized assembly and performance gains.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <label htmlFor="example-select" className="block text-sm font-medium text-slate-300 mb-2">Select an Example</label>
                <select id="example-select" value={activeExample} onChange={handleExampleChange} className="w-full p-3 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors">
                  {examples.map(category => (
                    <optgroup key={category.category} label={category.category}>
                        {category.examples.map(ex => (
                            <option key={ex.name} value={ex.name}>{ex.name}</option>
                        ))}
                    </optgroup>
                  ))}
                  <option value="Custom Code">Custom Code</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="cpp-code" className="block text-sm font-medium text-slate-300 mb-2">C++ Code Input</label>
                <textarea id="cpp-code" value={customCode} onChange={(e) => {
                    setCustomCode(e.target.value);
                    setActiveExample("Custom Code");
                }} onKeyDown={handleKeyDown} className={`w-full h-[400px] p-3 font-mono text-sm bg-slate-900 text-slate-100 rounded-md border focus:outline-none focus:ring-2 transition-colors ${validationError ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-cyan-500'}`} spellCheck="false" aria-invalid={!!validationError} aria-describedby={validationError ? "validation-error" : undefined} />
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