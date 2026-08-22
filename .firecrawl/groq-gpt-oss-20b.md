[![Groq](https://console.groq.com/groq-logo.svg)](https://console.groq.com/home)

[Docs](https://console.groq.com/docs/overview) [Login](https://console.groq.com/home)

[Log In](https://console.groq.com/login)

# GPT OSS 20B

`openai/gpt-oss-20b`

[Try it in Playground](https://console.groq.com/playground?model=openai/gpt-oss-20b)

TOKEN SPEED

~1000 tps

Powered bygroq

INPUT

Text

OUTPUT

Text

CAPABILITIES

[Tool Use](https://console.groq.com/docs/tool-use), [Browser Search](https://console.groq.com/docs/browser-search), [Code Execution](https://console.groq.com/docs/code-execution), [JSON Object Mode](https://console.groq.com/docs/structured-outputs#json-object-mode), [JSON Schema Mode](https://console.groq.com/docs/structured-outputs), [Reasoning](https://console.groq.com/docs/reasoning)

![OpenAI logo](https://console.groq.com/_next/static/media/openailogo.523c87a0.svg)OpenAI

[Model card](https://openai.com/index/gpt-oss-model-card/)

OpenAI's compact open-weight Mixture-of-Experts (MoE) model with 20B total parameters. Optimized for cost-efficient deployment and agentic workflows, it supports long-context reasoning, tool use, and function calling in a small memory footprint.

* * *

### PRICING

Input

$0.075

13M / $1

Cached Input

$0.037

27M / $1

Output

$0.30

3.3M / $1

* * *

### LIMITS

CONTEXT WINDOW

131,072

* * *

MAX OUTPUT TOKENS

65,536

* * *

### QUANTIZATION

This uses Groq's TruePoint Numerics, which reduces precision only in areas that don't affect accuracy, preserving quality while delivering significant speedup over traditional approaches. [Learn more here](https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed).

### [Key Technical Specifications](https://console.groq.com/docs/model/openai/gpt-oss-20b\#key-technical-specifications)

### Model Architecture

Built on a Mixture-of-Experts (MoE) architecture with 20B total parameters (3.6B active per forward pass). Features 24 layers with 32 MoE experts using Top-4 routing per token. Equipped with Grouped Query Attention (8 K/V heads, 64 Q heads) with rotary embeddings and RMSNorm pre-layer normalization.

### Performance Metrics

The GPT-OSS 20B model demonstrates exceptional performance across key benchmarks:

- MMLU (General Reasoning): 85.3%
- SWE-Bench Verified (Coding): 60.7%
- AIME 2025 (Math with tools): 98.7%
- MMMLU (Multilingual): 75.7% average

### Use Cases

Low-Latency Agentic Applications

Ideal for cost-efficient deployment in agentic workflows with advanced tool calling capabilities including web browsing, Python execution, and function calling.

Affordable Reasoning & Coding

Provides strong performance in coding, reasoning, and multilingual tasks while maintaining a small memory footprint for budget-conscious deployments.

Tool-Augmented Applications

Excels at applications requiring browser integration, Python code execution, and structured function calling with variable reasoning modes.

Long-Context Processing

Supports up to 131K context length for processing large documents and maintaining conversation history in complex workflows.

### Best Practices

- Utilize variable reasoning modes (low, medium, high) to balance performance and latency based on your specific use case requirements.
- Provide clear, detailed tool and function definitions with explicit parameters, expected outputs, and constraints for optimal tool use performance.
- Structure complex tasks into clear steps to leverage the model's agentic reasoning capabilities effectively.
- Use the full 128K context window for complex, multi-step workflows and comprehensive documentation analysis.
- Leverage the model's multilingual capabilities by clearly specifying the target language and cultural context when needed.

### [Get Started with GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b\#get-started-with-gptoss-20b)

Experience `openai/gpt-oss-20b` on Groq:

curlJavaScriptPythonJSON

shell

```
pip install groq
```

Python

```
1from groq import Groq
2client = Groq()
3completion = client.chat.completions.create(
4    model="openai/gpt-oss-20b",
5    messages=[\
6        {\
7            "role": "user",\
8            "content": "Explain why fast inference is critical for reasoning models"\
9        }\
10    ]
11)
12print(completion.choices[0].message.content)
```

### Was this page helpful?

YesNoSuggest Edits