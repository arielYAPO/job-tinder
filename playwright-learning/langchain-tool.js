import { DynamicTool } from "@langchain/core/tools";

const greeterTool = new DynamicTool({
    name: "greeter",
    description: "Greets a person by name. Input should be a person's name.",
    func: async (name) => {
        // Sanitize input (good habit!)
        const safeName = name.trim().slice(0, 50);  // Max 50 chars, remove whitespace
        return `Hello, ${safeName}! Welcome to LangChain!`;
    }
});

// Test it
const greeting = await greeterTool.invoke("Assah");
console.log(greeting);
