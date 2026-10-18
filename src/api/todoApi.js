import api from './client'

export async function listTodos() {
  const { data } = await api.get('/todos')
  return data
}

export async function getTodo(id) {
  const { data } = await api.get(`/todos/${id}`)
  return data
}

export async function createTodo(todo) {
  const { data } = await api.post('/todos', todo)
  return data
}

export async function updateTodo(id, todo) {
  const { data } = await api.put(`/todos/${id}`, todo)
  return data
}

export async function deleteTodo(id) {
  const { data } = await api.delete(`/todos/${id}`)
  return data
}

export async function completeTodo(id) {
  const { data } = await api.patch(`/todos/${id}/complete`)
  return data
}

export async function incompleteTodo(id) {
  const { data } = await api.patch(`/todos/${id}/incomplete`)
  return data
}
