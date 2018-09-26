const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const arrayList = require('arraylist');
const parseInt = require('parse-int');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fileStore = require('session-file-store')(session);
const twilio = require('twilio');
const accountSid = 'AC9388262777de3186753ee81fb05b8ec5';
const authToken = 'a5917e21f65e2698c8066dc4bdd259d5';
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const client = new twilio(accountSid, authToken);
app.use(cookieParser());

var symptomList = ["Headache", "Dizziness", "Nausea", "Fatigue", "Sadness", "None"];
var step = 0;
var symptom = '';
var symptomid = 0;
var count = 0;

app.use(session({
    secret: 'keyboard cat',
    store: new fileStore(),
    saveUninitialized: true
}));


let MessageSchema = new mongoose.Schema({
    phoneNo : String
});

let Message = mongoose.model('Message', MessageSchema);

app.use(bodyParser.urlencoded({extended:false}))
mongoose.connect('mongodb://amadUser:test123@ds113853.mlab.com:13853/amad',
    {
        useNewUrlParser:true
    })
    .then(()=>{
        console.log('Mongoose db connected');
    }).catch(error=>{
    console.log(error);
});

app.get('/',(req,res) => {
    res.end();
});

app.post('/inbound',(req,res) => {


    let from=req.body.From;
    let to=req.body.To;
    let body=req.body.Body;

    console.log(body);
    Message.find({phoneNumber: req.body.From},(err,message)=>{

        if(message.length ==0)
        {//Existing User
            if(step==0 && body==='Start'){
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'Please indicate your symptom (1)Headache, (2)Dizziness, (3)Nausea, (4)Fatigue, (5)Sadness, (0)None'
                })
                step = 1;
                // startTimer(to,from);
            }
            else if (step==1 && body==0){
                // stopTimer();
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'Thank you and we will check with you later'
                })
                step = 0;
            }
            else if (step==1 && req.body.Body > 0 && req.body.Body < 6)
            {
                // stopTimer();
                symptomid = req.body.Body-1
                symptom = symptomList[symptomid];
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'On a scale from 0 (none) to 4 (severe), how would you rate your "'+ symptom +'" in the last 24 hours?'
                })
                step = 2;
            }
            else if (step==1 && (req.body.Body < 0 || req.body.Body > 5))
            {   client.messages.create({
                to:`${from}`,
                from:`${to}`,
                body:'Please enter a number from 0 to 5'
            })
            }
            else if (step==2 && (req.body.Body < 0 || req.body.Body > 4))
            {
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'Please enter a number from 0 to 4'
                })
            }
            else if(step==2)
            {
                var nbr = Number(req.body.Body)
                switch (nbr)
                {
                    case 0:
                        client.messages.create({
                            to:`${from}`,
                            from:`${to}`,
                            body:'You do not have a '+symptom
                        })
                        break;
                    case 1:
                        client.messages.create({
                            to:`${from}`,
                            from:`${to}`,
                            body:'You have a mild '+symptom
                        })
                        break;
                    case 2:
                        client.messages.create({
                            to:`${from}`,
                            from:`${to}`,
                            body:'You have a mild '+symptom
                        })
                        break;
                    case 3:
                        client.messages.create({
                            to:`${from}`,
                            from:`${to}`,
                            body:'You have a moderate '+symptom
                        })
                        break;
                    case 4:
                        client.messages.create({
                            to:`${from}`,
                            from:`${to}`,
                            body:'You have a severe '+symptom
                        })
                        break;
                }//case statement ends here
                count++;
                if (count<4){
                    step=1;
                    symptomList.splice(symptomid,1);
                    var str='Please indicate your symptom';
                    for (i = 1; i < symptomList.length; i++) {
                        str += " (" + i + ")"+symptomList[i-1] +",";
                    }
                    str +=" (0)None";

                    client.messages.create({
                        to:`${from}`,
                        from:`${to}`,
                        body:str
                    })
                }
            }
            else{
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'Please text START to enroll into the study'
                })
            }
        }  //outer if ends here

        else
        {//New user
            // if(body==='START')
            // {
                let newMessage=new Message();
                newMessage.phoneNumber=from;
                newMessage.save(()=>{
                    client.messages.create({
                        to:`${from}`,
                        from:`${to}`,
                        body:'Welcome to the study. Please indicate your symptom (1)Headache, (2)Dizziness, (3)Nausea, (4)Fatigue, (5)Sadness, (0)None'

                    })
                })

                console.log("New User logging in");
            } //inner if ends here
        // }  //else ends here
    }) //Message.find() ends here
    res.end();
 });

app.post('/mobile/sendMessage/', (req,res,next) => {
    console.log('Inside sendMessage API', req.body.mobileNo, req.body.userMessage);
    client.messages.create({
        from: '+17042702625',
        to: '15129987115',
        body: 'Hello'
    }).then((message)=> console.log(message.sid))
        .catch(error => {
            console.log(error);
        });
});


module.exports = app;
