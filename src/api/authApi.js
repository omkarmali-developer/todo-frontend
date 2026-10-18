import api from './client'

export async function registerUser({ name, username, email, password }) {
  const { data } = await api.post('/auth/register', {
    name,
    username,
    email,
    password,
  })
  return data
}

export async function loginUser({ usernameOrEmail, password }) {
  const { data } = await api.post('/auth/login', {
    usernameOrEmail,
    password,
  })
  return data
}
