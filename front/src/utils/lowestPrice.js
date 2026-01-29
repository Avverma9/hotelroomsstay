const getLowestPrice = (rooms) => {
  if (!rooms || rooms.length === 0) return null;
  return Math.min(...rooms.map((room) => room.price));
};
export default getLowestPrice