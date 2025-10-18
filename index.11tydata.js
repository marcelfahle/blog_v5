module.exports = {
  eleventyComputed: {
    // if Sanity delivers a title, use it; otherwise fallback
    title: data =>
      (data.sanityPages?.homepage?.title) || "Hey, I'm Marcel!",
    description: data =>
      (data.sanityPages?.homepage?.description) ||
      "I'm a developer who likes Elixir and JS/TS."
  }
};
