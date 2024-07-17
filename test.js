const axios = require('axios')

async function getInbox() {
    const id = 1947534913
    const login = 'u6clc50pl0y'
    const domain = 'txcct.com'
    try {
      const response = await axios.get(
        `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${id}`
      );
      const text = response.data.htmlBody;
      
      const match = text.match(/confirmation_code=(\d+)/);

      if (match) {
        const code = match[1];
        console.log(code); // Ini akan mencetak '217377'
      } else {
        console.log('Kode tidak ditemukan');
      }
      
      
    } catch (error) {
      console.error(`error on getting message: ${error}`);
      throw error;
    }
  }

  getInbox();