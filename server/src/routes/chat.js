import { Router } from "express";
import { User, Chatbox } from "../models/Chat";
import axios from "axios";

let url = {
    discord: "http://localhost:8765",
    Telegram: "http://localhost:7000",
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
    console.log(req.body)
    // find the chatbox by pgid
    let chatbox = await Chatbox.findOne({ $or: [{ pgid1: req.body.gid }, { pgid2: req.body.gid }] });
    if (!chatbox) {
        res.status(404).json({ error: "chatroom not found" });
        return;
    }

    let target_pgid = (chatbox.pgid1 === req.body.gid.toString()) ? chatbox.pgid2 : chatbox.pgid1;
    let target_plat = (chatbox.pgid1 === req.body.gid.toString()) ? chatbox.plat2 : chatbox.plat1;

    console.log({target_pgid: target_pgid,target_plat: target_plat})
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
    // let llm_res = llm_query(req)
    let llm_res = "hasn't implemented";
    res.status(200).json({ message: llm_res });
});

export default router;
