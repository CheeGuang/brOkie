async function getCookies(){
    let cookies = await browser.cookies.getAll({});
    return cookies;
}

console.log(getCookies());