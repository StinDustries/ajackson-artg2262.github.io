// Greeting!
let name = prompt("Hello, what is your name?");
alert("Welcome " + name + ", it's a pleasure to meet you!");

let age = prompt("May I ask how old are you?");
alert("In that case, you must have been born around " + (2026 - age) + ", right? 😊");

let temp = prompt("What's the current temperature outside (in Fahrenheit?)");
alert("Oh, that would be about " + Math.floor((temp - 32) / 1.8) + " degrees Celcius!");

// Numerical input
let numInput = prompt("Please enter an integer value:");  // this value is a String
let num1 = Number(numInput);  // convert it to a number

numInput = prompt("Please enter a second integer value:");
let num2 = Number(numInput);

// Do something with it
alert(`Let me show you what I can do with the numbers ${num1} and ${num2}`);
alert(`${num1} + ${num2} = ${num1 + num2}`);
alert(`${num1} - ${num2} = ${num1 - num2}`);
alert(`${num1} * ${num2} = ${num1 * num2}`);
alert(`${num1} / ${num2} = ${num1 / num2}`);
alert(`${num1} % ${num2} = ${num1 % num2}`);
alert(`The max of ${num1} and ${num2} is ${num1 > num2 ? num1 : num2}`);
alert(`The min of ${num1} and ${num2} is ${num1 < num2 ? num1 : num2}`);
alert(`${num1} is an ${num1 % 2 == 0 ? "even" : "odd"} number`);
alert(`${num2} is an ${num2 % 2 == 0 ? "even" : "odd"} number`);
if (num1 != num2) {
  alert(`${num1} is ${num1 > num2 ? "greater" : "less"} than ${num2}`);
} else {
  alert(`${num1} is the same as ${num2}`);
}

let decInput = prompt("Please enter a number with a decimal part:");
let decNum = Number(decInput);

alert(`Let me show you what I can do with ${decNum}:`);
alert(`The negative of ${decNum} is ${decNum * -1}`);
alert(`The sine of ${decNum} radians is ${Math.sin(decNum)}`);
alert(`The cosine of ${decNum} radians is ${Math.cos(decNum)}`);
alert(`${decNum}^10 = ${decNum ** 10}`);
alert(`The square root of ${decNum} is ${Math.sqrt(decNum)}`);
alert(`${decNum} naturally rounded to the nearest integer is ${Math.round(decNum)}`);

let round = prompt("How many decimals to round to?");
round = Number(round);
alert(`${decNum} rounded to ${round} decimal places is ${Math.round(decNum * 10 ** round) / 10 ** round}`);

alert(`The floor of ${decNum} is ${Math.floor(decNum)}`);
alert(`The ceiling of ${decNum} is ${Math.ceil(decNum)}`);
alert(`The absolute value of ${decNum} is ${Math.abs(decNum)}`);

let fav = prompt("What's your favorite number?");
fav = Number(fav);
alert(`Fun fact, ${fav} in binary is ${fav.toString(2)}, ${fav} in hexadecimal is ${fav.toString(16)}, and ${fav} as a unicode character is "${String.fromCharCode(fav)}"!`);

alert(`Thanks for talking with me, ${name}! Have a nice day :)`);
