async function login() {

    console.log("login");

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    const response= await fetch("/portugalia/gestao_policia/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({username: username, password: password}),
    });

    alert(response.status);
}