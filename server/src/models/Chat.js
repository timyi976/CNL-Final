import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    uid: { type: String, required: true, unique: true },
    plat: { type: String, required: true },
    puid: { type: String, required: true },
});

const ChatboxSchema = new Schema({
    plat1: { type: String, required: true },
    pgid1: { type: String, required: true },
    plat2: { type: String, required: true },
    pgid2: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);
const Chatbox = mongoose.model("Chatbox", ChatboxSchema);

export { User, Chatbox };
