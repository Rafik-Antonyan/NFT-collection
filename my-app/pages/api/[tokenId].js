export default function handler(req, res) {
    const tokenId = req.query.tokenId
    const name = `Crypto Dev #${tokenId}`
    const description = 'Cryptodevs is an NFT collection'
    const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${Number(tokenId) - 1}.svg`;

    return res.json({
        name,
        description,
        image
    })
}