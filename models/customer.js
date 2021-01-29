/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.fullName = firstName + ' ' + lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  static async searchFullName(first, last) {
    const {rows } = await db.query(`SELECT first_name, last_name FROM customers WHERE first_name = $1 AND last_name = $2`, [first, last])
    
    const customer = this.get(rows[0])

    return 'hi'
  }

  static async searchPartialName(last) {
    const {rows } = await db.query(`SELECT id, 
    first_name AS "firstName",  
    last_name AS "lastName", 
    phone, 
    notes
    FROM customers WHERE last_name = $1 `, [last])

    return rows.map(c => new Customer(c))
  }

  static async getTopTen() {
    const {rows } = await db.query(`SELECT customer_id, COUNT(customer_id) FROM reservations GROUP BY customer_id ORDER BY count desc LIMIT 10;`)
    let customers = [];
    
    for (let c of rows) {
      customers.push(await this.get(c.customer_id))
    }
    // rows.map(async (c) => {
    //   return await this.get(c.customer_id)
    // })
    console.log(rows)
    console.log(customers)
    return customers
  }

}

module.exports = Customer;
