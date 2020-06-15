// overwrite the `languages` property to use a custom getter
Object.defineProperty(navigator, "languages", {
  get: function () {
    return ["en-US", "en"];
  },
});

Object.defineProperty(navigator, "platform", {
  get: function () {
    return ["Windows 10"];
  },
});

// overwrite the `plugins` property to use a custom getter
Object.defineProperty(navigator, "plugins", {
  get: function () {
    // this just needs to have `length > 0`, but we could mock the plugins too
    return [
      {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "application/x-google-chrome-pdf",
        description: "Portable Document Format",
        filename: "internal-pdf-viewer",
        name: "Chrome PDF Plugin",
      },
    ];
  },
});
