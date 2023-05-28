import { Configuration, OpenAIApi } from "openai";

export const getReply = async input => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const messages = [{ role: "user", content: input }];
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.6,
    });
    console.log(completion.data.choices[0].message.content);
    const content = completion.data.choices[0].message.content;
    const responses = content.split("\n").filter(line => line.trim() !== "");
    return responses;
};
