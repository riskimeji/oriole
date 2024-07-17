const axios = require('axios');
const readline = require('readline');
const { getEmail, cekMail } = require('./temail.js');
const fs = require('fs');

let reff = 'ZTf4hP'; //your reff code
let invitReff = 'riskimeji'; //your reff code
let cookieHeader = '';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// async function getInputRef() {
//   rl.question('Masukkan kode refferal: ', (userInput) => {
//     if (userInput) {
//       reff = userInput;
//       // console.log('Referensi berhasil disimpan:', reff);
//       getAccessToken();
//     } else {
//       console.log('Tidak ada input referensi.');
//     }
//     rl.close();
//   });
// }

async function getAccessToken() {
  try {
    const response = await axios.post('https://finulab.com/api/auth/region', {
      headers: headers_auth,
    });

    const accessToken = response.data.accessToken;
    console.log('token :', accessToken);
    cookieHeader = response.headers['set-cookie'];
    if (cookieHeader) {
      const cookies = cookieHeader[0].split(';');
      const sessionIdCookie = cookies[0];
      console.log('Cookie:', sessionIdCookie);
    }
    cekRefferal(accessToken);
    console.log('mengecek validasi reffereal......');
  } catch (error) {
    const startIndex =
      error.response.data.indexOf('<title>') + '<title>'.length;
    const endIndex = error.response.data.indexOf('</title>', startIndex);

    const title = error.response.data.substring(startIndex, endIndex);
    console.error(title);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await getAccessToken();
  }
}

async function cekRefferal(accessToken, attempt = 1, maxAttempts = 3) {
  try {
    const headers_put = {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
      Cookie: cookieHeader,
    };

    const response = await axios.put(
      `https://finulab.com/api/users/search-invitation-code?q=${reff}`,
      {},
      { headers: headers_put }
    );
    console.log('refferal :', response.data);
    cekEmail(accessToken);
    // console.log('generate email....');
  } catch (error) {
    console.log(error);
    if (attempt < maxAttempts) {
      cekRefferal(accessToken, attempt + 1);
    } else {
      console.error('Maximum attempts reached. Exiting...');
    }
  }
}

async function cekEmail(accessToken) {
  try {
    const headers_put = {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
      Cookie: cookieHeader,
    };
    const email = await getEmail();
    // const email = await getEmailInput();

    const response = await axios.put(
      `https://finulab.com/api/users/search-email?q=${email}`,
      {},
      { headers: headers_put }
    );

    if (response.data === true) {
      console.log('email : ', response.data);
      cekUsername(accessToken, email);
      console.log('membuat username random.....');
    } else {
      console.log('email sudah terdaftar');
      console.log('email', response.data);
    }
    // console.log(response);
  } catch (error) {
    console.log(error);
    console.error('error saat memasukan email masukan ulang');
    cekEmail(accessToken);
  }
}

async function cekUsername(accessToken, email, retryCount = 0) {
  try {
    const headers_put = {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
      Cookie: cookieHeader,
    };
    const username = generateRandomUsername();
    const response = await axios.put(
      `https://finulab.com/api/users/search?q=${username}`,
      {},
      { headers: headers_put }
    );
    console.log('username kamu adalah:', username);
    console.log('username', response.data);
    registerUser(accessToken, username, email);
    console.log('mendaftarkan user.....');
  } catch (error) {
    console.log(error);
    cekUsername(accessToken, email);
  }
}

async function registerUser(accessToken, username, email, retryCount = 0) {
  try {
    const birthdate = getRandomBirthdate();
    const userData = {
      username: `${username}`,
      email: `${email}`,
      password: 'Jelek123@',
      birthMonth: 'may',
      birthDate: 10,
      birthYear: 2003,
      inviter: invitReff,
      invitationCode: reff,
    };

    const headers_post = {
      ...headers,
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await axios.post(
      'https://finulab.com/api/users/sign-up',
      userData,
      { headers: headers_post }
    );
    console.log('%c sukses mendaftarkan user', 'color: green;');
    const lastAccessToken = response.data.accessToken;
    confirmOtp(lastAccessToken, username, email);
  } catch (error) {
    console.error('Error while registering user:', error);
    if (retryCount < 999) {
      await registerUser(accessToken, username, email, retryCount + 1);
    } else {
      console.error('Max retry limit reached for registerUser');
    }
  }
}

async function confirmOtp(lastAccessToken, username, email) {
  try {
    const headers_post = {
      ...headers,
      Authorization: `Bearer ${lastAccessToken}`,
      Cookie: cookieHeader,
    };

    const [login, domain] = email.split('@');

    const otp = await cekMail(login, domain);
    // const otp = await getOtpInput();
    const userData = {
      username: username,
      oneTimeCode: otp,
      type: 'new-sign-up',
      inviter: invitReff, //ubah jdi inviter lo
      invitationCode: reff,
    };

    const response = await axios.post(
      'https://finulab.com/api/users/sign-up/confirmation',
      userData,
      { headers: headers_post }
    );

    console.log('Response:', response.data);
    if (response.data.status == 'ok') {
      fs.appendFileSync('email.txt', email + '|' + username + '\n');
    } else {
      console.log('otp tidak ditemukan');
    }
  } catch (error) {
    console.error('Error while confirming OTP:', error.response.data);
  } finally {
    console.log('akun 1 selesai');
    await getAccessToken();
  }
}

const headers = {
  Host: 'finulab.com',
  Origin: 'https://finulab.com',
  Referer: `https://finulab.com/login/${reff}`,
  //   'Sec-Ch-Ua':
  //     '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
  //   'Sec-Ch-Ua-Mobile': '?0',
  //   'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  //   'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Site': 'cross-site',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
};

const headers_auth = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'en-US,en;q=0.9',
  Connection: 'keep-alive',
  //   'Content-Length': '2',
  'Content-Type': 'application/json',
  Host: 'finulab.com',
  Origin: 'https://finulab.com',
  Referer: `https://finulab.com/login/${reff}`,
  //   'Sec-Ch-Ua':
  //     '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
  //   'Sec-Ch-Ua-Mobile': '?0',
  //   'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  //   'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Site': 'cross-site',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
};

function getRandomBirthdate() {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 20;
  const randomYear =
    Math.floor(Math.random() * (currentYear - minYear + 1)) + minYear;
  const randomMonth = Math.floor(Math.random() * 12) + 1;
  const randomDay = Math.floor(Math.random() * 28) + 1;

  return {
    birthMonth: randomMonth,
    birthDate: randomDay,
    birthYear: randomYear,
  };
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

function getEmailInput() {
  return new Promise((resolve, reject) => {
    rl.question('2. Masukkan alamat email: ', (email) => {
      resolve(email);
    });
  });
}

function getOtpInput() {
  return new Promise((resolve, reject) => {
    rl.question('Masukkan OTP (One-Time Password): ', (otp) => {
      resolve(otp);
    });
  });
}

getAccessToken();
