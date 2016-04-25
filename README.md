# Boilerplate for Node.js Application

This is a pattern I use in order to organize my servers.

It uses Express and Mongoose at it's core, but it can really be changed for
anything.

The main objective of this, is to create a simple pattern for Model and helpers
initialization, as well as a way of lifting and managing servers with forever.

### Usage
Clone this repo, and modify what you want.

### Example
This comes preloaded with a "Pets" controller and full REST Api.
Check those routes:

- `localhost:3000/api/ping`
- `localhost:3000/api/pets/create?name=meaw&race=Bulldog`
- `localhost:3000/api/pets`

## Initialization step
Steps are parts where you configure, and starting your app.

We set paths for node.js files that can be executed with callbacks. Each step
takes your time to complete executing, and one after the other is run.

## Helpers and Models
They are auto-loaded (basically it saves the object from the file in a global scope)


## It's just this? Where is the rest?
Really, I didn't have time to document this. I don't know if it's really useful,
but if people think so, it can become something better.
