<script setup>
import { getDagCid, toBytes } from '../utils'
import { importer } from 'ipfs-unixfs-importer';
import { reactive } from 'vue';

const newBook = reactive({
  name: '',
  author: '',
  description: '',
  file: undefined
});

async function addBook() {
  const { name, author, description } = newBook;
  const messageData = { name, author, description };

  const dataCid = await getDagCid(messageData);
  const message = {
    descriptor: {
      method: 'CollectionsWrite',
      schema: 'https://schema.org/Book',
      dataCid: dataCid.toString()
    }
  }

  const boundary = `${Date.now()}`;

  let data = `--${boundary}\r\n`;
  data += `content-disposition: form-data; name='target'\r\n`;
  data += `\r\n`;
  data += 'did:jank:alice\r\n';

  data += `--${boundary}\r\n`;
  data += `content-disposition: form-data; name='message'\r\n`;
  data += `\r\n`;
  data += `${JSON.stringify([message])}\r\n`;

  const mockBlockstore = { put() { }, get() { } };
  const chunker = importer([{ content: toBytes(messageData) }], mockBlockstore, { cidVersion: 1 });

  for await (let chunk of chunker) {
    data += `--${boundary}\r\n`;
    data += `content-disposition: form-data; name='message-data'; filename='${chunk.cid}'\r\n`;
    data += `Content-Type: 'application/json'\r\n`
    data += '\r\n';

    data += `${chunk.unixfs.data}\r\n`;
  }

  data += `--${boundary}--`;

  console.log(data);

  const xhr = new XMLHttpRequest();

  xhr.addEventListener('load', function (event) {
    console.log('response status', this.status);
  });

  xhr.addEventListener('error', event => {
    console.log('ruh roh. error', event);
  });

  xhr.open('POST', 'http://localhost:3000/')
  xhr.setRequestHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
  xhr.send(data);
}

function handleFileSelection(event) {
  newBook.file = event.target.files[0];
  newBook.name = newBook.file.name;
}
</script>

<template>
  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      <form @submit.prevent="addBook" class="mb-0 space-y-6">
        <header class="text-lg">
          Add Book
        </header>

        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
          <div class="mt-1">
            <input v-model="newBook.name" id="name" name="name" type="text" required
              class="w-full border-gray-300 rounded-lg shadow-sm" />
          </div>
        </div>

        <div>
          <label for="author" class="block text-sm font-medium text-gray-700">Author</label>
          <div class="mt-1">
            <input v-model="newBook.author" id="author" name="author" type="text" required
              class="w-full border-gray-300 rounded-lg shadow-sm" />
          </div>
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <div class="mt-1">
            <input v-model="newBook.description" id="description" name="description" type="text" required
              class="w-full border-gray-300 rounded-lg shadow-sm" />
          </div>
        </div>

        <div>
          <span class="sr-only">Choose File</span>
          <input type="file" ref="fileInput" @change="handleFileSelection($event)"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm" />

        </div>
        <button type="submit"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Submit</button>
        <div>

        </div>
      </form>
    </div>

  </div>
</template>