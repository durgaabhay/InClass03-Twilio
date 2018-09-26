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
    Message.find().select('phoneNumber').then((message)=>{
        if(message !== null){
            console.log('User exists : ' + message + 'with step value' + step);
            if(step==0 && body ==='Start') {
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'Please indicate your symptom (1)Headache, (2)Dizziness, (3)Nausea, (4)Fatigue, (5)Sadness, (0)None'
                })
                step = 1;
            }
            else if (step==1 && body == 0){
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'Thank you and we will check with you later'
                })
                step = 0;
            }
            else if (step==1 && body > 0 && body < 6)
            {
                symptomid = body-1
                symptom = symptomList[symptomid];
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'On a scale from 0 (none) to 4 (severe), how would you rate your "'+ symptom +'" in the last 24 hours?'
                })
                step = 2;
            }
            else if (step==1 && (body < 0 || body > 5))
            {   client.messages.create({
                to:`${from}`,
                from:`${to}`,
                body:'Please enter a number from 0 to 5'
            })
            }
            else if (step==2 && (body < 0 || body > 4))
            {
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body:'Please enter a number from 0 to 4'
                })
            }
            else if(step==2)
            {
                let userSymptom = Number(body)
                switch (userSymptom)
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
                }//switch case ends here
                count = count + 1;
                console.log('incrementing count value to display symptoms again ' + count);
                if (count<3){
                    step=1;
                    symptomList.splice(symptomid,1);
                    console.log('After truncating symptom from the list :' + symptomList.length);
                    let questionString='Please indicate your symptom';
                    for (let i = 1; i < symptomList.length; i++) {
                        questionString += " (" + i + ")"+symptomList[i-1] +",";
                    }
                    questionString +=" (0)None";

                    client.messages.create({
                        to:`${from}`,
                        from:`${to}`,
                        body:questionString
                    })
                }
            }else{//else loop if user enter something other than start
                console.log('User entering wrong message to start the survey' + body);
                client.messages.create({
                    to:`${from}`,
                    from:`${to}`,
                    body: 'If you wish to take up the survey enter by typing Start'
                })
            }
        }else{
            //loop begins for new user
            if(body === 'Start'){
                console.log('new user entering' + body + 'with phone number : ' + from);
                let newMessage = new Message();
                newMessage.phoneNumber = from;
                console.log(newMessage.phoneNumber);
                newMessage.save().then(()=>{
                    client.messages.create({
                        to:`${from}`,
                        from:`${to}`,
                        body:'Welcome to the study. Please indicate your symptom (1)Headache, (2)Dizziness, (3)Nausea, (4)Fatigue, (5)Sadness, (0)None'
                    })
                })
            }//Loop ends for new user
        }
    }) //Message.find() ends here
    res.end();
});


app.get('/users', (req,res,next)=>{
    Message.find().select('phoneNumber')
        .exec()
        .then(data => {
            console.log(data);
            res.status(200).json({data});
        })
        .catch(err=>{
            console.log(err);
            res.status(500).json({
                message: 'Error retrieving surveys',
                error:err
            });
        });
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