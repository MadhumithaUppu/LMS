const bodyParser = require('body-parser');
const express = require('express');
const mysqlcon = require('./connection');
const ejs = require("ejs");
var path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

global.thisuser = '*';
global.qid = 1;

// Main page
app.get('/', (req, res) => {
    res.render('MainPage');
});

app.post('/MainPage', (req, res) => {
    if(req.body.role == 'Instructor') {
        res.redirect('/InstructorLogin');
    } else {
        res.redirect('/StudentLogin');
    }
})

// Login
app.get('/InstructorLogin', (req, res) => {
    res.render('InstructorLogin');
});

app.get('/StudentLogin', (req, res) => {
    res.render('StudentLogin');
});

app.post('/InstructorLogin', (req, res) => {
    mysqlcon.query('SELECT * FROM Instructor WHERE i_email ="' + req.body.i_email +'"', function(err, result) {
        if (err) throw err;
        if(result.length > 0) {
            console.log(result);
            
                if(result[0].pswd === req.body.pswd) {
                    thisuser = result[0].instr_id;
                    res.redirect('/InstructorDashboard');
                } else{
                    res.send('Incorrect password');
                }
           
        } else {
            res.send('User does not exist');
        }
    })
})

app.post('/StudentLogin', (req, res) => {
    mysqlcon.query('SELECT * FROM Student WHERE s_email ="' + req.body.s_email +'"', function(err, result) {
        if (err) throw err;
        if(result.length > 0) {
            console.log(result);
            
                if(result[0].pswd === req.body.pswd) {
                    thisuser = result[0].student_id;
                    res.redirect('/StudentDashboard');
                } else{
                    res.send('Incorrect password');
                }
           
        } else {
            res.send('User does not exist');
        }
    })
})

// Dashboard
app.get('/InstructorDashboard', (req, res) => {
    res.render('InstructorDashboard');
});

app.get('/StudentDashboard', (req, res) => {
    res.render('StudentDashboard');
});

// Video
app.get('/InstructorVideo', (req, res) => {
    var sql="SELECT * FROM Video";
        mysqlcon.query(sql, (err, data) => {
            res.render('InstructorVideo', {data: data});
    });
});

app.get('/StudentVideo', (req, res) => {
    var sql="SELECT * FROM Video";
        mysqlcon.query(sql, (err, data) => {
            res.render('StudentVideo', {data: data});
    });
});

app.get('/VideoForm', (req, res) => {
    var sql='SELECT lesson_id FROM Lesson';
    mysqlcon.query(sql, function (err, data) {
      if (err) throw err;
      res.render('VideoForm', {data: data});
    });
});

app.post('/VideoForm', (req, res) => {
    var data = req.body;
    var sql = 'INSERT into Video SET ? ';
    mysqlcon.query(sql, data, (err, result) => {
        if(err) throw err;
    });
    res.redirect('/InstructorVideo')
});

// Assignment
app.get('/StudentAssignment', (req, res) => {
    var sql="SELECT * FROM Assignment";
        mysqlcon.query(sql, (err, data) => {
            res.render('StudentAssignment', {data: data});
    });
});

app.get('/InstructorAssignment', (req, res) => {
    var sql="SELECT * FROM Assignment";
        mysqlcon.query(sql, (err, data) => {
            res.render('InstructorAssignment', {data: data});
    });
});

app.get('/AssignmentForm', (req, res) => {
    res.render('AssignmentForm');
})

app.post('/AssignmentForm', (req, res) => {
    var data = req.body;
    var sql = 'INSERT into Assignment SET ? ';
    mysqlcon.query(sql, data, (err, result) => {
        if(err) throw err;
    });
    res.redirect('/InstructorAssignment')
})

app.get('/AssignmentDelete/:id', (req, res) => {
    mysqlcon.query('delete from Assignment where assignment_id = "' + req.params.id + '"', (err, res) => {
        if(err) throw error;
    })
    res.redirect('/InstructorAssignment');
});

// Final Result
app.get('/InstructorResult', (req, res) => {
    var sql="SELECT * FROM Final_result";
        mysqlcon.query(sql, (err, data) => {
            res.render('InstructorResult', {data: data});
    });
});

app.get('/StudentResult', (req, res) => {
    var sql='SELECT * FROM Final_result where student_id ="' + thisuser +'"';
        mysqlcon.query(sql, (err, data) => {
            res.render('StudentResult', {data: data});
    });
});

app.get('/ResultForm', (req, res) => {
    res.render('ResultForm');
})

app.post('/ResultForm', (req, res) => {
    var data = req.body;
    var sql = 'INSERT into Final_result SET ? ';
    mysqlcon.query(sql, data, (err, result) => {
        if(err) throw err;
    });
    res.redirect('/InstructorResult')
})

// Quiz

app.get('/QuizForm', (req, res) => {
    res.render('QuizForm');
})

app.post('/QuizForm', (req, res) => {
    var data = req.body;
    var sql = 'INSERT into Quiz SET ? ';
    mysqlcon.query(sql, data, (err, result) => {
        if(err) throw err;
    });
    res.redirect('/ContentForm');
});

app.get('/ContentForm', (req, res) => {
    var sql='SELECT MAX(quiz_id) FROM Quiz';
        mysqlcon.query(sql, (err, data) => {
            res.render('ContentForm', {data: data});
    });
});

app.post('/ContentForm', (req, res) => {
    var data = req.body;
    var sql = 'INSERT into Content SET ? ';
    mysqlcon.query(sql, data, (err, result) => {
        if(err) throw err;
    });
    res.redirect('/InstructorDashboard');
});

app.get('/StudentQuiz', (req, res) => {
    var sql='SELECT * FROM Content where quiz_id = ( SELECT MAX(quiz_id) FROM Content )';
        mysqlcon.query(sql, (err, data) => {
            console.log(data);
            res.render('StudentQuiz', {data: data});
    });
});

app.post('/StudentQuiz', (req, res) => {
    var selected_option = parseInt(req.body.role);
    console.log(selected_option);
    var sql='SELECT * FROM Content where quiz_id = ( SELECT MAX(quiz_id) FROM Content )';
        mysqlcon.query(sql, (err, data) => {
            console.log(data[0].correct_option);
            var score = 0;
            if(data[0].correct_option == selected_option) {
                score = data[0].marks;
            } else {
                score = 0;
            }
            
            var insert_data = {
                quiz_id: data[0].quiz_id,
                score: score,
                student_id: thisuser
            }
            var sql = 'INSERT into Quiz_result SET ? ';
            mysqlcon.query(sql, insert_data, (err, result) => {
                if(err) throw err;
            });
            res.redirect('/StudentQuizResult')
    });
})

app.get('/StudentQuizResult', (req, res) => {
    var sql='SELECT * FROM Quiz_result where student_id ="' + thisuser +'"';
        mysqlcon.query(sql, (err, data) => {
            res.render('StudentQuizResult', {data: data});
    });
});

// QA

app.get('/QA', (req, res) => {
    var sql="SELECT * FROM Qa";
        mysqlcon.query(sql, (err, data) => {
            res.render('QA', {data: data});
    });
})

app.get('/QAdetails/:id', (req, res) => {
    mysqlcon.query('select * from QA_details where qa_id = "' + req.params.id + '"', (err, data) => {
        if(err) throw error;
        console.log(data);
        res.render('QAdetails', {data: data, id: req.params.id});
    });
});

app.post('/QAanswerForm', (req, res) => {
    var data = req.body;
    var sql = 'INSERT into QA_details SET ? ';
    mysqlcon.query(sql, data, (err, result) => {
        if(err) throw err;
    });
    res.redirect('/QA');
});

app.get('/QAaskForm', (req, res) => {
    var sql='SELECT lesson_id FROM Lesson';
    mysqlcon.query(sql, function (err, data) {
      if (err) throw err;
      res.render('QAaskForm', {data: data});
    });
});

app.post('/QAaskForm', (req, res) => {
    var data = req.body;
    var sql = 'INSERT into QA SET ? ';
    mysqlcon.query(sql, data, (err, result) => {
        if(err) throw err;
    });
    res.redirect('/QA');
});


app.listen(3000, function() {
    console.log('server started on port 3000');
});