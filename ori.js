const axios = require('axios')
const { getEmail, cekMail } = require('./temail.js');
const fs = require('fs');


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function regist(){
    const email = await getEmail();
    const username = generateRandomUsername();

    const userData = {
        username: `${email}`,
        email: `${email}`,
        password: 'Jelek123@',
        invitedBy: 'riskimejij4kdmm',
        name: `${username}`
    }
    try {
        const response = await axios.post('https://api-live.orioleinsights.io/auth/registration', userData);
        if (response.data.status == 'success') {
            console.log('Sukses daftar\n');
            console.log('Saatnya verify OTP\n');
            const [login, domain] = email.split('@');

            // Tunggu 5 detik sebelum cek email
            await delay(4000);

            const otp = await cekMail(login, domain);
            console.log('....\n')
            confirmOtp(email, otp);
        }
    } catch (error) {
        console.log('error');
    }

}

async function confirmOtp(email, otp){
    const userData = {
        username: `${email}`,
        otp: `${otp}`
        }

    try {
        const response = await axios.post('https://api-live.orioleinsights.io/auth/complete-registration', userData);
        if(response.data.status == 'success'){
            console.log('berhasil daftar')
            saveResult(`Berhasil daftar untuk email: ${email}`);
            await regist()
        }else{
            console.log('gagal')
        }
    } catch (error) {
        
    }
}


function generateRandomUsername() {
    const characters =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let username = '';
    for (let i = 0; i < 8; i++) {
      username += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return username;
  }

  function saveResult(result) {
    fs.appendFile('result.txt', `${result}\n`, (err) => {
        if (err) {
            console.log('Gagal menyimpan hasil', err);
        } else {
            console.log('Hasil berhasil disimpan');
        }
    });
}


  regist()

  module.exports = { regist };
