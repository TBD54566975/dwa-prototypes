<script setup>
import { bytesToJson, getDagCid, inflateData, sendRequest, store, sleep } from '../utils';
import { reactive, inject, onMounted, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

const messageStore = inject('messageStore');

const newBook = reactive({
  name: '',
  author: '',
  description: '',
  file: undefined
});

const books = ref([]);

async function addBook() {
  const { name, author, description } = newBook;
  const messageData = { name, author, description };

  const messages = [];

  const dataCid = await getDagCid(messageData);
  const bookMessage = {
    descriptor: {
      dataCid: dataCid,
      method: 'CollectionsWrite',
      protocol: 'Library',
      recordId: uuidv4(),
      schema: 'https://schema.org/Book',
    }
  };

  await store(bookMessage, messageData, messageStore, { author: 'did:jank:alice', tenant: 'did:jank:alice' });

  messages.push({ message: bookMessage, data: messageData });

  const fileReader = new FileReader();
  fileReader.readAsArrayBuffer(newBook.file);

  while (fileReader.readyState !== FileReader.DONE) {
    await sleep(100);
  }

  console.log('File Reading DONE!');

  const fileData = fileReader.result;
  const fileCid = await getDagCid(fileData);
  const fileMessage = {
    descriptor: {
      dataCid: fileCid.toString(),
      method: 'CollectionsWrite',
      protocol: 'Library',
      recordId: uuidv4(),
    }
  }

  await store(fileMessage, fileData, messageStore, { author: 'did:jank:alice', tenant: 'did:jank:alice' });
  messages.push({ message: fileMessage, data: fileData });

  // const resp = await sendRequest('did:jank:alice', messages);
  // console.log(resp.status);
}

onMounted(async () => {
  const bookMessages = await messageStore.query({ tenant: 'did:jank:alice' });
  const booksJson = [];

  for (let { descriptor } of bookMessages) {
    if (!descriptor.schema) {
      continue;
    }

    const bookBytes = await inflateData(descriptor.dataCid, messageStore);
    const book = bytesToJson(bookBytes);

    booksJson.push(book);
  }

  books.value = booksJson;
});

function handleFileSelection(event) {
  newBook.file = event.target.files[0];
  newBook.name = newBook.file.name;
}
</script>

<template>
  <div class="flex flex-col">
    <!-- Form -->
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

    <!-- Contacts Table -->
    <div class="mt-8 w-screen">
      <h1 class="text-xl mb-2 ml-5">Your Books</h1>
      <table class="w-full">
        <thead class="border-b-2 border-gray-300">
          <tr>
            <th class="p-3 text-sm font-semibold tracking-wide text-left">Name</th>
            <th class="p-3 text-sm font-semibold tracking-wide text-left">Author</th>
            <th class="p-3 text-sm font-semibold tracking-wide text-left">Description</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="book in books">
            <td class="p-3 text-sm">{{ book.name }}</td>
            <td class="p-3 text-sm">{{ book.author }}</td>
            <td class="p-3 text-sm">{{ book.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>