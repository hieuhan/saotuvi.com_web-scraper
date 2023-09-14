const fs = require('fs');
const http = require('http');
const https = require('https');
const axios = require('axios');
const imageSize = require('image-size');
const { basename, extname, join } = require('path');
const config = require('../config');

const sleep = async () => {

    const time = Math.floor(Math.random() * (config.RANDOM_MAX - config.RANDOM_MIN + 1)) + config.RANDOM_MIN;
        
    console.log(`Đợi xử lý sau => ${time/1000} giây...\n`);
   
    return new Promise(resolve => setTimeout(resolve, time));
}

function urlGetParam(pageUrl, param)
{
    let resultVar = '';

    try 
    {
        let currentUrl = new URL(pageUrl);

        resultVar = parseInt(currentUrl.searchParams.get(param) || 1);
    } 
    catch (error) 
    {
        console.error(`urlGetParam error => ${error}\n`);
    }

    return resultVar;
}

function urlSetParam(pageUrl, param, value)
{
    let resultVar = '';

    try 
    {
        let currentUrl = new URL(pageUrl);

        currentUrl.searchParams.set(param, value);

        resultVar = currentUrl.href; 
    } 
    catch (error) 
    {
        console.error(`urlSetParam error => ${error}\n`);
    }

    return resultVar;
}

const toSlug = (str) => {
    // Chuyển hết sang chữ thường
    str = str.toLowerCase();     
    
    // xóa dấu
    str = str
        .normalize('NFD') // chuyển chuỗi sang unicode tổ hợp
        .replace(/[\u0300-\u036f]/g, ''); // xóa các ký tự dấu sau khi tách tổ hợp

    // Thay ký tự đĐ
    str = str.replace(/[đĐ]/g, 'd');

    // Xóa ký tự đặc biệt
    str = str.replace(/([^0-9a-z-\s])/g, '');

    // Xóa khoảng trắng thay bằng ký tự -
    str = str.replace(/(\s+)/g, '-');

    // Xóa ký tự - liên tiếp
    str = str.replace(/-+/g, '-');

    // xóa phần dư - ở đầu & cuối
    str = str.replace(/^-+|-+$/g, '');

    // return
    return str;
}

const getDatePath = (date) => {
    return `${date.getFullYear()}/${(date.getMonth() + 1)}/${date.getDate()}`;
}

const getDirPath = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
        return dirPath;
    } catch (error) {
        console.error(error);
        return Promise.reject(error);
    }
}

const getFileSize = (path) => new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
        if (err) {
            console.log(err)
            reject(null);
            return
        }

        resolve(stats.size)
    })
})

const getDimension = (path) => new Promise((resolve, reject) => {
    imageSize(path, (err, dimension) => {
        if (err) {
            console.log(err);
            reject(null);
            return
        }
    
        resolve (dimension);
    })
})

// const getDimension = async(path) => {
//     var dimension = null;
//     try {
//         dimension = await imageSize(path); 
//     } catch (error) {
//         console.log(error)
//     }

//     return dimension;
// }

async function downloadImage(url) {
    try {

        // const response = await axios({
        //     url,
        //     method: 'GET',
        //     responseType: 'arraybuffer'
        // });

        let fileName = url.split('/').pop();
        
        const dirPath = getDirPath(`images/${getDatePath(new Date())}`);
    
        let filePath = join(dirPath, fileName);

        if(fs.existsSync(filePath))
        {
            fileName = formatDate(new Date()) + '-' + fileName;
            filePath = join(dirPath, fileName);
        }

        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                if (res.statusCode === 200) {
                    res.pipe(fs.createWriteStream(filePath))
                        .on('error', (error) => {
                            console.error(`downloadImage => ${ url } error => ${error}\n`);
                            reject('error'); 
                        })
                        .once('close', () => resolve(filePath));
                } else {
                    // Consume response data to free up memory
                    res.resume();
                    reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
    
                }
            });
        });

        // return new Promise((resolve, reject) => {
        //     response.data.pipe(fs.createWriteStream(filePath))
        //         .on('error', (error) => { 
        //             console.error(`downloadImage => ${ url } error => ${error}\n`);
        //             reject('error'); 
        //         })
        //         .once('close', () => resolve(filePath)); 
        // });

    } catch (error) 
    {
        console.error(`downloadImage => ${ url } error => ${error}\n`);
    }
}

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  
  function formatDate(date) {
    return (
    //   [
    //     date.getFullYear(),
    //     padTo2Digits(date.getMonth() + 1),
    //     padTo2Digits(date.getDate()),
    //   ].join('') +
    //   '' +
      [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
      ].join('')
    );
  }

  function strToDate(dtStr) { //'12/09/2023, 16:30'
    if (!dtStr) return null
    let dateParts = dtStr.split("/");
    let timeParts = dateParts[2].split(",")[1].trim().split(":");
    dateParts[2] = dateParts[2].split(",")[0].trim();
    // month is 0-based, that's why we need dataParts[1] - 1
    var dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
    
    const timeZone = 'Asia/Ho_Chi_Minh';

    return new Date(
        dateObject.toLocaleString('en-US', {
          timeZone,
        }),
      );
  }

module.exports = {
    sleep: sleep,
    urlGetParam: urlGetParam,
    urlSetParam: urlSetParam,
    toSlug: toSlug,
    downloadImage: downloadImage,
    formatDate: formatDate,
    strToDate: strToDate,
    getFileSize: getFileSize,
    getDimension: getDimension
}