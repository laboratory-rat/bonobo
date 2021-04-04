db.createUser({
  user: 'service',
  pwd: 'service',
  roles: [
    {
      role: 'readWrite',
      db: 'ms-model-rest'
    }
  ]
})