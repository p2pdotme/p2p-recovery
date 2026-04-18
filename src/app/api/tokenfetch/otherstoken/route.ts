import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const ZAPPER_API_KEY = process.env.ZAPPER_API_KEY

const query = `
  query TokenBalances($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
    portfolioV2(addresses: $addresses, chainIds: $chainIds) {
      tokenBalances {
        totalBalanceUSD
        byToken(first: $first) {
          totalCount
          edges {
            node {
              name
              symbol
              price
              tokenAddress
              imgUrlV2
              decimals
              balanceRaw
              balance
              balanceUSD
            }
          }
        }
      }
    }
  }
`

export async function POST(request: NextRequest) {
  try {
    const { address, chainId, limit = 50 } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    const targetChainId = chainId || 143 // Default to Monad
    console.log(`Fetching tokens for address ${address} on chain ${targetChainId} using Zapper API`)

    const response = await axios({
      url: 'https://public.zapper.xyz/graphql',
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': ZAPPER_API_KEY,
      },
      data: {
        query,
        variables: {
          addresses: [address],
          first: limit,
          chainIds: [targetChainId],
        },
      },
    })

    if (response.data.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`)
    }

    type ZapperEdge = {
      node: {
        name: string
        symbol: string
        tokenAddress: string
        balance: string
        balanceRaw: string
        decimals: number
        price?: number
        balanceUSD?: number
        imgUrlV2?: string
      }
    }

    const portfolioData = response.data.data.portfolioV2
    const tokens = portfolioData.tokenBalances.byToken.edges.map((edge: ZapperEdge) => ({
      name: edge.node.name,
      symbol: edge.node.symbol,
      address: edge.node.tokenAddress,
      balance: edge.node.balance,
      balanceRaw: edge.node.balanceRaw,
      decimals: edge.node.decimals,
      price: edge.node.price,
      balanceUSD: edge.node.balanceUSD,
      imgUrl: edge.node.imgUrlV2
    }))

    return NextResponse.json({
      tokens,
      totalBalanceUSD: portfolioData.tokenBalances.totalBalanceUSD,
      totalCount: portfolioData.tokenBalances.byToken.totalCount
    })

  } catch (error) {
    console.error('Error in other tokens API:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch tokens from Zapper' },
      { status: 500 }
    )
  }
}
