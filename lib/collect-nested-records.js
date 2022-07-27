module.exports = function (comments) {
  return comments.reduce(
    (children, item) => {
      children(item.path.replace(/(^|\.)\w+$/g, "")).push({
        // remove last `.section`
        ...item, // keep current items properties
        children: children(item.path), // specify the array that contains children entries
      });

      return children;
    },
    function (key) {
      return this[key] || (this[key] = []);
    }.bind({})
  )(""); // yield the root elements
};
