
module.exports = function ( app ) {
    app.get('/login',function(req,res){
        res.render('login');
    });
 
    app.post('/login',function(req,res){
        var user={
            username:'admin',
            password:'admin'
        };
        if(req.body.username == user.username && req.body.password == user.password) {
            listDirectory(__dirname,req,res);
            req.session.user = user;
        } else {
            req.session.error = "用户名或密码不正确";
            // res.render('login');
            res.writeHead(200,{
                "Content-Type":"text/html;charset=utf-8",
            });
            res.write('<body>用户名或密码不正确，请重新登录！','utf-8');
            res.end();
        }
    });

    app.get('/*', function(req, res) {
        console.log("用户是：" + req.session.user);
        if(req.session.user === undefined) {
            res.writeHead(200,{
                "Content-Type":"text/html;charset=utf-8",
            });
            res.write('请先登录！','utf-8');
            res.end();
            return;
        }

        var url = require("url");
        var pathname = url.parse(req.url).pathname.replace(/%20/g,' '),
            re = /(%[0-9A-Fa-f]{2}){3}/g;
        //能够正确显示中文，将三字节的字符转换为utf-8编码
        pathname = pathname.replace(re,function(word){
            var buffer=new Buffer(3),
                array=word.split('%');
            array.splice(0,1);
            array.forEach(function(val,index){
                buffer[index]=parseInt('0x'+val,16);
            });
            return buffer.toString('utf8');
        });
        
        filename = path.join(__dirname, pathname);
        console.log('文件是：' + filename);
        fs.exists(filename,function(exists){
            if(!exists){
                console.log('找不到文件'+filename);
                write404(req,res);
            } else {
                fs.stat(filename,function(err,stat) {
                    if(stat.isFile()) {
                        showFile(filename,req,res);
                    } else if(stat.isDirectory()) {
                        listDirectory(filename,req,res);
                    }
                });
            }
        });
    });
};


var fs = require("fs"),
    path = require("path"),
    mime = require("./mime").mime;

//显示文件夹下面的文件
function listDirectory(parentDirectory,req,res){
    fs.readdir(parentDirectory,function(error,files){
        var body=formatBody(parentDirectory,files);
        res.writeHead(200,{
            "Content-Type":"text/html;charset=utf-8",
            "Content-Length":Buffer.byteLength(body,'utf8'),
            "Server":"NodeJs("+process.version+")"
        });
        res.write(body,'utf8');
        res.end();
    });

}

//显示文件内容
function showFile(file,req,res){
    fs.readFile(filename,'binary',function(err,file){
        var contentType=mime.lookupExtension(path.extname(filename));
        console.log(filename);
        var fna = filename.split("\\");
        var fn = fna[fna.length - 1];
        res.writeHead(200,{
            "Content-Type":contentType,
            "Content-Length":Buffer.byteLength(file,'binary'),
            "Server":"NodeJs("+process.version+")"
        });
        res.write(file,"binary");
        res.end();
    });
}

//在Web页面上显示文件列表，格式为<ul><li></li><li></li></ul>
function formatBody(parent,files){
    var res=[],
        length=files.length;
    res.push("<!doctype>");
    res.push("<html>");
    res.push("<head>");
    res.push("<meta http-equiv='Content-Type' content='text/html;charset=utf-8'></meta>")
    res.push("<title>Node.js文件服务器</title>");
    res.push("</head>");
    res.push("<body width='100%'>");
    res.push("<ul>")
    files.forEach(function(val,index){
        var stat=fs.statSync(path.join(parent,val));
        if(stat.isDirectory(val)){
            val=path.basename(val)+"/";
        }else{
            val=path.basename(val);
        }
        res.push("<li><a href='"+val+"'>"+val+"</a></li>");
    });
    res.push("</ul>");
    res.push("<div style='position:relative;width:98%;bottom:5px;height:25px;background:gray'>");
    res.push("<div style='margin:0 auto;height:100%;line-height:25px;text-align:center'>Powered By Node.js</div>");
    res.push("</div>")
    res.push("</body>");
    return res.join("");
}

//如果文件找不到，显示404错误
function write404(req,res){
    var body="文件不存在:-(";
    res.writeHead(404,{
        "Content-Type":"text/html;charset=utf-8",
        "Content-Length":Buffer.byteLength(body,'utf8'),
        "Server":"NodeJs("+process.version+")"
    });
    res.write(body);
    res.end();
}