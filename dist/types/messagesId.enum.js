export var msgId;
(function (msgId) {
    msgId[msgId["CHOKE"] = 0] = "CHOKE";
    msgId[msgId["UNCHOKE"] = 1] = "UNCHOKE";
    msgId[msgId["INTERESTED"] = 2] = "INTERESTED";
    msgId[msgId["UNINTERESTED"] = 3] = "UNINTERESTED";
    msgId[msgId["HAVE"] = 4] = "HAVE";
    msgId[msgId["BITFIELD"] = 5] = "BITFIELD";
    msgId[msgId["REQUEST"] = 6] = "REQUEST";
    msgId[msgId["PIECE"] = 7] = "PIECE";
    msgId[msgId["CANCEL"] = 8] = "CANCEL";
    msgId[msgId["PORT"] = 9] = "PORT";
    msgId[msgId["KEEPALIVE"] = -1] = "KEEPALIVE";
})(msgId || (msgId = {}));
;
