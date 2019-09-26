it('Test 200 Response', () => {
  cy.request({
    url: Cypress.env('APP_URL')
  })
    .then((resp) => {
      expect(resp.status).to.eq(200)
    })
}) 
