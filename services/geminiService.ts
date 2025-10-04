
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are an expert compiler backend for a custom RISC-V processor. Your task is to translate high-level C++ code for neural network operations into the custom assembly language and provide an analysis of the instruction count.

This custom ISA includes several new instructions designed for floating-point operations:
1.  mac rd, rs1, rs2 (Multiply-Accumulate: rd = rd + rs1 * rs2)
2.  relu rd, rs1 (ReLU activation: rd = max(0, rs1))
3.  conv2d.3x3 rd, rs1, rs2, rs3 (3x3 Convolution: rd = result, rs1 = input base addr, rs2 = kernel base addr, rs3 = input stride). This single instruction calculates the dot product of a 3x3 input patch and a 3x3 kernel.
4.  dwconv.3x3 rd, rs1, rs2, rs3 (3x3 Depthwise Convolution: rd = result, rs1 = input base addr, rs2 = kernel base addr, rs3 = input stride). Performs a 3x3 depthwise convolution.
5.  maxpool.2x2 rd, rs1, rs2 (2x2 Max Pooling: rd = result, rs1 = input base addr, rs2 = input stride). Finds the max value in a 2x2 input region, replacing a loop of comparisons.
6.  sigmoid rd, rs1 (Sigmoid activation: rd = 1 / (1 + exp(-rs1)))
7.  tanh rd, rs1 (Tanh activation: rd = tanh(rs1))

RULES:
- You must use these custom instructions where applicable to optimize the code.
- Assume the processor has a floating-point unit (FPU). For any floating-point arithmetic not covered by the custom instructions, use standard RISC-V 'F' extension instructions (e.g., fadd.s, fmul.s, flw, fsw).
- When you see a standard 3x3 convolution loop, you MUST replace the entire loop with a single \`conv2d.3x3\` instruction.
- When you see a 3x3 depthwise convolution loop, you MUST replace it with a single \`dwconv.3x3\` instruction.
- When you see a 2x2 max pooling operation, you MUST replace it with a single \`maxpool.2x2\` instruction.
- For convolutions with kernels larger than 3x3 (e.g., 5x5), you must implement them using a loop with the 'mac' instruction for each element.
- When you see a mathematical pattern that matches a custom instruction, you MUST replace it. For example, a C++ expression like \`1.0f / (1.0f + expf(-A[i]))\` MUST be translated to a single \`sigmoid\` instruction. Similarly, a call to \`tanhf(A[i])\` MUST be translated to a single \`tanh\` instruction.
- Provide a realistic estimate of the number of instructions it would take to implement the core logic on a standard RISC-V processor vs. our custom ISA. For the custom ISA, count each custom instruction as a single instruction.
- Your output must be a JSON object that strictly adheres to the provided schema.`;

const SYSTEM_INSTRUCTION_RTL = `You are a senior RTL design engineer. Your task is to translate a high-level description into four distinct components: synthesizable SystemVerilog code, a basic SystemVerilog testbench, a conceptual text-based netlist, and a set of formal verification assertions.

RULES:
1.  **SystemVerilog RTL**:
    - The generated code must be well-commented, synthesizable, and follow best practices.
    - Use standard constructs. For sequential circuits, include clear clocking (clk) and active-high reset (rst_n or rst) logic.
2.  **SystemVerilog Testbench**:
    - Generate a basic, self-checking testbench that instantiates the generated RTL module.
    - It should drive the inputs with a few meaningful values to demonstrate functionality.
    - Use \`$display\` to report the status of the test cases (e.g., "Test Case 1 Passed").
    - Include a clock generator and handle the reset sequence.
3.  **Conceptual Netlist**:
    - Provide a simplified, text-based, hierarchical representation of the synthesized logic.
    - Represent logic using common gate primitives (e.g., AND, OR, NOT, XOR, MUX2, DFF, ADDER).
    - This is a conceptual view, not a formal netlist format like EDIF. It should be human-readable.
4.  **SystemVerilog Assertions (SVA)**:
    - Generate a set of relevant SVA properties to formally verify the design's key behaviors.
    - For example, for a FIFO, assert that 'full' and 'empty' are never high simultaneously. For an arbiter, assert that only one grant is active at a time.
    - These assertions should be in a separate block and clearly commented.
5.  **Output Format**:
    - Your entire output must be a single JSON object that strictly adheres to the provided schema. No extra text or explanations outside the JSON.`;
    
const SYSTEM_INSTRUCTION_EXPLAIN_RTL = `You are a senior RTL design engineer and expert instructor. Your task is to provide a clear, concise, and educational explanation for a given piece of SystemVerilog or hardware-related code.

RULES:
1.  **Audience**: Assume the user is a student or junior engineer who understands basic digital logic but may not be an expert in SystemVerilog or the specific design pattern.
2.  **Structure**:
    - Start with a high-level summary: What is the purpose of this module or code block?
    - Break down the code section by section (e.g., parameters, ports, internal logic, always blocks).
    - Use bullet points for clarity.
    - Explain *why* things are done a certain way (e.g., "This \`always_ff\` block is used to model sequential logic, meaning its value only changes on a clock edge.").
    - For testbenches, explain the stimulus being applied and how the output is checked.
    - For SVA, explain what property is being asserted and what bug it would catch.
3.  **Clarity over Jargon**: Avoid overly complex jargon. If you must use a technical term, briefly define it.
4.  **Formatting**: Use Markdown for formatting (e.g., \`code snippets\`, **bolding**, *italics*).
5.  **Conciseness**: Be thorough but not verbose. Get to the point quickly.
6.  **Output Format**: Your entire output must be a single JSON object that strictly adheres to the provided schema. No extra text or explanations outside the JSON.`;


const responseSchema = {
  type: Type.OBJECT,
  properties: {
    assemblyCode: {
      type: Type.STRING,
      description: "The generated custom RISC-V assembly code, with comments."
    },
    instructionCount: {
      type: Type.OBJECT,
      description: "Comparison of estimated instruction counts for the core operation.",
      properties: {
        standard: {
          type: Type.INTEGER,
          description: "Estimated instruction count on a standard RISC-V processor."
        },
        custom: {
          type: Type.INTEGER,
          description: "Instruction count on our custom ISA, using specialized instructions."
        }
      }
    }
  }
};

const rtlResponseSchema = {
  type: Type.OBJECT,
  properties: {
    rtlCode: {
      type: Type.STRING,
      description: "The generated, synthesizable SystemVerilog code for the module."
    },
    testbenchCode: {
      type: Type.STRING,
      description: "The generated SystemVerilog testbench for the module."
    },
    netlistDescription: {
        type: Type.STRING,
        description: "A human-readable, text-based conceptual netlist of the synthesized logic."
    },
    svaCode: {
        type: Type.STRING,
        description: "The generated SystemVerilog Assertions (SVA) code for formal verification."
    },
    validation: {
      type: Type.OBJECT,
      description: "A syntax validation result for the generated RTL code.",
      properties: {
        hasErrors: {
          type: Type.BOOLEAN,
          description: "True if syntax errors were found, otherwise false."
        },
        errors: {
          type: Type.ARRAY,
          description: "A list of found syntax errors. Empty if hasErrors is false.",
          items: {
            type: Type.OBJECT,
            properties: {
              line: { type: Type.INTEGER, description: "The line number of the error." },
              message: { type: Type.STRING, description: "A description of the error." }
            }
          }
        }
      }
    }
  }
};

const explainRtlResponseSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: {
            type: Type.STRING,
            description: "The detailed, Markdown-formatted explanation of the provided code."
        }
    }
};


// Custom error for better handling in the component
export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiResponseError';
  }
}

export async function* generateAssemblyStream(cppCode: string): AsyncGenerator<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: `Translate and analyze the following C++ code:\n\n\`\`\`cpp\n${cppCode}\n\`\`\``,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    for await (const chunk of response) {
        yield chunk.text;
    }
  } catch (error) {
    console.error("Error generating assembly from Gemini API:", error);
    throw new Error("An error occurred while communicating with the AI service.");
  }
}

export interface RtlValidationResult {
  hasErrors: boolean;
  errors: { line: number; message: string }[];
}

export interface RtlGenerationResult {
    rtlCode: string;
    testbenchCode: string;
    netlistDescription: string;
    svaCode: string;
    validation: RtlValidationResult;
}

export async function* generateRtlStream(description: string): AsyncGenerator<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: `Generate SystemVerilog for the following description:\n\n"${description}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_RTL,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: rtlResponseSchema,
      },
    });

    for await (const chunk of response) {
        yield chunk.text;
    }
  } catch (error) {
    console.error("Error generating RTL from Gemini API:", error);
    throw new Error("An error occurred while communicating with the AI service.");
  }
}

interface RtlExplanationResult {
    explanation: string;
}

export async function generateRtlExplanation(code: string, language: string): Promise<string> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Explain the following ${language} code:\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_EXPLAIN_RTL,
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: explainRtlResponseSchema,
            },
        });

        const result: RtlExplanationResult = JSON.parse(response.text);
        if (!result || typeof result.explanation !== 'string') {
             throw new AiResponseError("The AI service returned an explanation with an unexpected structure.");
        }
        return result.explanation;

    } catch (error) {
        console.error("Error generating RTL explanation from Gemini API:", error);
        if (error instanceof SyntaxError) {
             throw new AiResponseError("The AI service returned malformed explanation data.");
        }
        throw new Error("An error occurred while communicating with the AI service for explanation.");
    }
}
