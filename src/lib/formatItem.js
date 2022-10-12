module.exports = (item) => {
  const formatedItem = {};
  Object.keys(item).forEach((key) => {
    const [type] = Object.keys(item[key]);
    formatedItem[key] = item[key][type];
  });
  return formatedItem;
};
