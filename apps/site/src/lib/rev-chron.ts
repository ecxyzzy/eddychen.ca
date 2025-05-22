type BlogObjectStub = { data: { date: Date } };

export const revChron = (a: BlogObjectStub, b: BlogObjectStub) =>
  b.data.date.valueOf() - a.data.date.valueOf();
