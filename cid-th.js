/* SMART CARD READER */
/*const smartcard = require('smartcard')
    , Devices = smartcard.Devices
    , devices = new Devices()
    , CommandApdu = smartcard.CommandApdu
    , pcsc1 = require('pcsclite')
    , pcsc = pcsc1()
    , legacy = require('legacy-encoding')*/
const moment = require('moment'),
    mysql = require('mysql'),
    os = require('os')

let cmdIndex = 0,
    inGetImage = false,
    imgTemp = 'ssssss'
let mImgTemp = ''
var obj = []
var socket_global = ""

/*devices.on('device-activated', event => {
    const currentDevices = event.devices
    let device = event.device
    //console.log(`Device '${device}' activated, devices: ${currentDevices}`)
    for (let prop in currentDevices) {
        //console.log("Devices: " + currentDevices[prop])
    }

    device.on('card-inserted', event => {
        let card = event.card
        // console.log(`Card '${card.getAtr()}' inserted into '${event.device}'`)
        card.on('command-issued', event => {
            //console.log(`Command '${event.command}' issued to '${event.card}' `)
        })
        card.on('response-received', event => {
            if (inGetImage) {
                //    console.log('read image ' +imgTemp)
                // readImageOneLine(card)
            } else {
                //console.log('no read image ' +imgTemp)
            }
            // console.log(`Response '${event.response}' received from '${event.card}' in response to '${event.command}'`)
        })
        card
            .issueCommand(new CommandApdu(new CommandApdu({ bytes: [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01] })))
            .then((response) => {
                console.log("CARD INSERT")
                //     readImageOneLine(card)
                readData(card)
            }).catch((error) => {
                console.error(error)
            })
    })
    device.on('card-removed', event => {
        obj = []
        console.log(`CARD REMOVE`)
    })
})
devices.on('device-deactivated', event => {
    console.log(`Device '${event.device}' deactivated, devices: [${event.devices}]`)
})
function readData(card) {
    card
        .issueCommand((new CommandApdu({ bytes: [0x80, 0xb0, 0x00, 0x04, 0x02, 0x00, 0x0d] })))
        .then((response) => {
            //console.log(`readCid '${response.toString('hex')}`)

            card
                .issueCommand((new CommandApdu({ bytes: [0x00, 0xc0, 0x00, 0x00, 0x0d] })))
                .then((response) => {
                    response = response.slice(0, -2)
                    let mImgTemp = response.toString()
                    obj.push(mImgTemp)
                    //readImageOneLine(card)
                    readFullname(card)
                }).catch((error) => {
                    console.error(error)
                })


        }).catch((error) => {
            console.error(error)
        })

}
function readFullname(card) {
    card
        .issueCommand((new CommandApdu({ bytes: [0x80, 0xb0, 0x00, 0x11, 0x02, 0x00, 0xd1] })))
        .then((response) => {

            card
                .issueCommand((new CommandApdu({ bytes: [0x00, 0xc0, 0x00, 0x00, 0xd1] })))
                .then((response) => {
                    //   var x=  iconv.convert(response) // returns "a va"
                    var buffer = legacy.decode(response, "tis620")
                    var arr = buffer.split('#')
                    var new_arr = []
                    for (var i in arr) {
                        if (arr[i] == "") continue
                        if (i == 3) {
                            var cut_ = arr[i].split(" ")
                            for (var z in cut_) {
                                if (cut_[z] == "") continue
                                new_arr.push(cut_[z])
                            }
                        } else if (i == 6) {
                            var cut_2 = arr[i].split(" ")
                            for (var w in cut_2) {
                                if (cut_2[w] == "") continue
                                if (w != 0) {
                                    var sub_y = cut_2[w].substring(0, 4),
                                        sub_m = cut_2[w].substring(4, 6),
                                        sub_d = cut_2[w].substring(6, 8),
                                        born_date = parseInt(sub_y - 543) + "-" + sub_m + "-" + sub_d
                                    new_arr.push(born_date)
                                } else {
                                    new_arr.push(cut_2[w])
                                }
                            }
                        } else {
                            new_arr.push(arr[i])
                        }
                    }
                    obj.push(new_arr)
                    //console.log(new_arr)
                    readAddress(card)
                }).catch((error) => {

                })
        }).catch((error) => {
            console.error(error)
        })

}
function readAddress(card) {
    card
        .issueCommand((new CommandApdu({ bytes: [0x80, 0xb0, 0x15, 0x79, 0x02, 0x00, 0x64] })))
        .then((response) => {
            card
                .issueCommand((new CommandApdu({ bytes: [0x00, 0xc0, 0x00, 0x00, 0x64] })))
                .then((response) => {
                    var buffer = legacy.decode(response, "tis620")
                    //console.log(`Response readFullname '${buffer}`)
                    var arr = buffer.split('#')
                    var arr_data = []
                    for (var i in arr) {
                        if (arr[i] == "") continue
                        if (i == (arr.length - 1)) {
                            var cut = arr[i].split(" ")
                            arr_data.push(cut[0])
                        } else {
                            arr_data.push(arr[i])
                        }
                    }
                    obj.push(arr_data)
                    //console.log(arr_data)
                }).catch((error) => {
                    console.error(error)
                })
        }).catch((error) => {
            console.error(error)
        })
}
let checkMod = 0

async function send_data(req, res) {
    let th_cid = "" 
        ,th_first_name = ""
        ,th_second_name = ""
        ,en_first_name = ""
        ,en_second_name = ""
        ,born_date = ""
        ,address = ""
        ,full_name = ''
        ,pc_name = ''
    if (obj.length > 0) {
        th_cid = obj[0]
        th_first_name = obj[1][0] + obj[1][1]
        th_second_name = obj[1][2]
        en_first_name = obj[1][3] + obj[1][4]
        en_second_name = obj[1][5]
        born_date = obj[1][6]
        address = obj[2][0] + " " + obj[2][1] + " " + obj[2][2] + " " + obj[2][3] + " " + obj[2][4]
        full_name = th_first_name + ' ' + th_second_name
    }
    let data = {
        full_name: full_name,
        address: address,
        born_date: born_date,
        th_cid: th_cid
    }
    res.send(data)
    console.log(req.headers.host + "|" + moment().format('YYYY-MM-DD') + "|" + "th-cid: " + obj[0])
}*/
function get_host_name(req, res) {
    let obj2 = {
        host_name: os.hostname()
    }
    res.send(obj2)
}

//exports.send_data = send_data
exports.get_host_name = get_host_name