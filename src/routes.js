require('dotenv').config();
const axios = require('axios');
const { response } = require('express');
const express = require("express");
const router = express.Router();

axios.defaults.headers.common['X-API-Key'] = process.env.BUNGIE_API_KEY;

const encodebase64 = str => {
    let buff = Buffer.from(str);
    return buff.toString('base64');
};

const bungieURL = 'https://www.bungie.net/Platform';

router.route("/authorize/:auth_code")
    .get((req, res) => {
        console.log(`GET /authorize/${req.params.auth_code}`);
        axios.post(`${bungieURL}/App/OAuth/Token/`, `grant_type=authorization_code&code=${req.params.auth_code}`,
            {
                headers: {
                    "Authorization": `Basic ${encodebase64(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })
            .then(response => {
                let token = response.data.access_token;
                axios.get(`${bungieURL}/User/GetMembershipsForCurrentUser/`, {
                        headers: {
                            "Authorization": 'Bearer ' + token
                        }
                    })
                    .then(response => {
                        const destiny_info = response.data.Response.destinyMemberships[0];
                        res.status(200).send(JSON.stringify({
                            access_token: token,
                            member_type: destiny_info.membershipType,
                            member_id: destiny_info.membershipId
                        }));
                    })
                    .catch(err => {
                        console.log('authorization failed');
                        res.status(500).send();
                    })
            })
            .catch(err => {
                console.log('authorization failed');
                res.status(500).send();
            });
    });

router.route("/getProfile/:member_type/:member_id/:components")
    .get((req, res) => {
        console.log(`GET /getProfile/${req.params.member_type}/${req.params.member_id}/${req.params.components}`);

        axios.get(`${bungieURL}/Destiny2/${req.params.member_type}/Profile/${req.params.member_id}?components=${req.params.components}`, {
                headers: {
                    "Authorization": req.header('Authorization')
                }
            })
            .then(response => {
                res.status(200).send(JSON.stringify(response.data.Response));
            })
            .catch(err => {
                console.log(err);
                res.status(500).send();
            });
    });

router.route("/itemlookup/:hash")
    .get((req, res) => {
        console.log(`GET /itemlookup/${req.params.hash}`);

        axios.get(`${bungieURL}/Destiny2/Manifest/DestinyInventoryItemDefinition/${req.params.hash}/`,  {
                headers: {
                    "Authorization": req.header('Authorization')
                }
            })
            .then(response => {
                res.status(200).send(JSON.stringify(response.data.Response.displayProperties));
            })
            .catch(err => {
                console.log(err);
                res.status(500).send();
            });
    });

router.route("/equipitem/:item_id/:char_id/:mem_type")
.get((req, res) => {
    console.log(`GET /equipitem/${req.params.item_id}/${req.params.char_id}/${req.params.mem_type}`);

    const data = {
        "itemId": req.params.item_id,
        "characterId": req.params.char_id,
        "membershipType": req.params.mem_type
    };

    axios.post(`${bungieURL}/Destiny2/Actions/Items/EquipItem/`, data, {
            headers: {
                "Authorization": req.header('Authorization'),
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            res.status(200).send();
        })
        .catch(err => {
            console.log(err);
            res.status(500).send();
        });
});

router.route("/transfervault/:to_from/:item_hash/:item_id/:char_id/:mem_type")
.get((req, res) => {
    console.log(`GET /transfervault/${req.params.to_from}/${req.params.item_hash}/${req.params.item_id}/${req.params.char_id}/${req.params.mem_type}`);

    const data = {
        "itemReferenceHash": req.params.item_hash,
        "stackSize": 1,
        "transferToVault": req.params.to_from,
        "itemId": req.params.item_id,
        "characterId": req.params.char_id,
        "membershipType": req.params.mem_type
    };

    axios.post(`${bungieURL}/Destiny2/Actions/Items/TransferItem/`, data, {
            headers: {
                "Authorization": req.header('Authorization'),
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            res.status(200).send();
        })
        .catch(err => {
            console.log(err);
            res.status(500).send();
        });
});

module.exports = router;