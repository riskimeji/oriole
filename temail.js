const axios = require('axios');
const {regist} = require('./ori.js')
async function getEmail() {
  try {
    const response = await axios.get(
      'https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'
    );
    const data = response.data[0];
    // const [login, email] = data.split('@');
    console.log('Email kamu: ', data);
    // console.log(response);
    return data;
    // cekMail(login, email);
  } catch (error) {
    getEmail()
    console.error(`error on getting email: ${error}`);
    // return [];
  }
}

async function cekMail(login, domain) {
  try {
    const response = await axios.get(
      `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`
    );
    const data = response.data;
    if (data.length === 0) {
      console.error('Tidak ada pesan yang ditemukan');
      cekMail(login, domain);
    }
    const lastMessage = data[data.length - 1];
    const id = lastMessage.id;
    return getInbox(id, login, domain);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Tidak ada pesan yang ditemukan');
      cekMail(login, domain);
    } else {
      console.error('Terjadi kesalahan:', error.message);
      cekMail(login, domain);
    }
  }
}

async function getInbox(id, login, domain) {
  try {
    const response = await axios.get(
      `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${id}`
    );
    const text = response.data.htmlBody;
      
    const match = text.match(/confirmation_code=(\d+)/);

    if (match) {
      const code = match[1];
      console.log('kode adalah', code);
      return code;
    } else {
      console.log('Kode tidak ditemukan');
      return 'kode tidak ditemukan';
    }
  } catch (error) {
    console.error(`error on getting message: ${error}`);
    throw error;
  }
}

module.exports = { getEmail, cekMail };
