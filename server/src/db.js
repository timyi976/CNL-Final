import mongoose from "mongoose";
import dotenv from "dotenv-defaults";

const connect = () => {
    dotenv.config();
    mongoose
        .connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(res => console.log("Connected to MongoDB"))
        .catch(err => console.log(err));
};

export default { connect };
