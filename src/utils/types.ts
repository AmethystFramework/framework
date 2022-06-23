export type Async<T> = PromiseLike<T> | T;

export type RecAsyncGen<T> = AsyncGenerator<T, void | RecAsyncGen<T>>;
