// Mock DB interface for Vercel static deployment since there's no live Node backend
export const db = {
  select: () => ({ from: () => [] }),
  insert: () => ({ values: () => ({}) }),
  update: () => ({ set: () => ({ where: () => ({}) }) }),
  delete: () => ({ where: () => ({}) }),
};
