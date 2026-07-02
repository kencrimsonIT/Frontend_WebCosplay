import axiosInstance from './axios_instance'

const unwrap = (response) => response.data?.data ?? response.data

export const fetchCart = async () => {
  const response = await axiosInstance.get('/api/cart')
  return unwrap(response)
}

export const addCartItem = async (payload) => {
  const response = await axiosInstance.post('/api/cart/items', payload)
  return unwrap(response)
}

export const updateCartItemQuantity = async (id, quantity) => {
  const response = await axiosInstance.put(`/api/cart/items/${id}`, { quantity })
  return unwrap(response)
}

export const removeCartItem = async (id) => {
  const response = await axiosInstance.delete(`/api/cart/items/${id}`)
  return unwrap(response)
}

export const clearRemoteCart = async () => {
  const response = await axiosInstance.delete('/api/cart')
  return unwrap(response)
}
