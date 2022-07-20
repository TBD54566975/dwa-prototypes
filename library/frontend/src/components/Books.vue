<script setup></script>

<template>
  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      <form class="mb-0 space-y-6">
        <header class="text-lg">
          Add Book
        </header>

        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
          <div class="mt-1">
            <input id="name" name="name" type="text" required class="w-full border-gray-300 rounded-lg shadow-sm" />
          </div>
        </div>

        <div>
          <label for="author" class="block text-sm font-medium text-gray-700">Author</label>
          <div class="mt-1">
            <input id="author" name="author" type="text" required class="w-full border-gray-300 rounded-lg shadow-sm" />
          </div>
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <div class="mt-1">
            <input id="description" name="description" type="text" required
              class="w-full border-gray-300 rounded-lg shadow-sm" />
          </div>
        </div>

        <div>
          <span class="sr-only">Choose File</span>
          <input type="file"
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