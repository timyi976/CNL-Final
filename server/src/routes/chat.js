import { Router } from "express";
import { User, Chatbox } from "../models/Chat";
import { getReply } from "./gpt";
import axios from "axios";

let url = {
    DC: "1",
    Telegram: "2",
};

const router = Router();

router.post("/new", async (req, res) => {
    // check if puid is already in db
    console.log(req.body);
    let user_puid = await User.find({ plat: req.body.plat, puid: req.body.puid });
    if (user_puid.length !== 0) {
        res.status(409).json({ error: "uid exists" });
        return;
    }

    // check if uid is already in db
    let user_uid = await User.find({ uid: req.body.uid });
    if (user_uid.length !== 0) {
        res.status(409).json({ error: "puid exists" });
        return;
    }

    // store user info in db
    await User.create({ plat: req.body.plat, puid: req.body.puid, uid: req.body.uid });
    res.status(200).send("OK");
});

router.post("/chat", async (req, res) => {
    // check if target user exists
    let target_user = await User.findOne({ uid: req.body.uid });
    if (!target_user) {
        res.status(404).json({ error: "target user not found" });
        return;
    }
    console.log(target_user);
    // check if the channel on platform has been used
    let chatbox = await Chatbox.find({ $or: [{ pgid1: req.body.gid }, { pgid2: req.body.gid }] });
    if (chatbox.length !== 0) {
        res.status(409).json({ error: "chatroom has created" });
        return;
    }

    // check if the target platform bot work correctly
    await axios
        .post(url[target_user.plat] + "/create", { puid: target_user.puid })
        .then(async bot_res => {
            // store chatbox info in db
            await Chatbox.create({
                plat1: req.body.plat,
                pgid1: req.body.gid,
                plat2: target_user.plat,
                pgid2: bot_res.data.gid,
            });
            res.status(200).send("OK");
        })
        .catch(err => {
            res.status(404).json({ error: "target platform bot error" });
            return;
        });
});

router.post("/send", async (req, res) => {
    // find the chatbox by pgid
    let chatbox = await Chatbox.findOne({ $or: [{ pgid1: req.body.gid }, { pgid2: req.body.gid }] });
    if (!chatbox) {
        res.status(404).json({ error: "chatroom not found" });
        return;
    }

    let target_pgid = chatbox.pgid1 === req.body.gid ? chatbox.pgid2 : chatbox.pgid1;
    let target_plat = chatbox.pgid1 === req.body.gid ? chatbox.plat2 : chatbox.plat1;

    // send message and gid to target platform bot
    await axios
        .post(url[target_plat] + "/send", { gid: target_pgid, msg: req.body.msg })
        .then(() => {
            res.status(200).send("OK");
        })
        .catch(err => {
            res.status(404).json({ error: "target platform bot error" });
            return;
        });
});

router.post("/reply", async (req, res) => {
    try {
        const prompt = `List three replies, no other words, no number, use newline to separate:\n${req.body.msg}`;
        let llm_res = await getReply(prompt);
        res.status(200).json({ msg: llm_res });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/translate", async (req, res) => {
    try {
        const prompt = `Translate to zh-TW:\n${req.body.msg}`;
        let llm_res = await getReply(prompt);
        res.status(200).json({ msg: llm_res });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
