import React, {memo, useCallback, useState} from 'react';
import Link from 'next/link';
import TokenRowInput from 'components/app/sweepooor/TokenRowInput';
import {ImageWithFallback} from 'components/ImageWithFallback';
import {useSweepooor} from 'contexts/useSweepooor';
import {useMountEffect} from '@react-hookz/web';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {TMinBalanceData} from 'hooks/useBalances';
import type {TCowQuote} from 'hooks/useSolverCowswap';
import type {ReactElement} from 'react';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

type TTokenRowProps = {
	balance: TMinBalanceData,
	tokenAddress: TAddress,
	amount: TNormalizedBN,
	explorer?: string
};
const	TokenRow = memo(function TokenRow({tokenAddress, balance, amount, explorer}: TTokenRowProps): ReactElement {
	const {set_selected, set_amounts, set_quotes, selected} = useSweepooor();
	const {safeChainID} = useChainID();
	const [isDisabled, set_isDisabled] = useState(false);
	const isSelected = Boolean(selected.includes(toAddress(tokenAddress)) || false);

	const	onToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
		const	isNowChecked = event.target.checked;
		if (isDisabled) {
			return;
		}

		performBatchedUpdates((): void => {
			set_selected((prev): TAddress[] => isNowChecked ? [...prev, tokenAddress] : prev.filter((item: TAddress): boolean => item !== tokenAddress));
			if (!isNowChecked) {
				set_quotes((quotes: TDict<TCowQuote>): TDict<TCowQuote> => {
					const newQuotes = {...quotes};
					delete newQuotes[toAddress(tokenAddress)];
					return newQuotes;
				});
				setTimeout((): void => document?.getElementById(`quote-reset-${toAddress(tokenAddress)}`)?.click(), 10);
			} else {
				setTimeout((): void => document?.getElementById(`quote-refresh-${toAddress(tokenAddress)}`)?.click(), 10);
			}
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDisabled, tokenAddress]);

	useMountEffect((): void => {
		set_amounts((amounts: TDict<TNormalizedBN>): TDict<TNormalizedBN> => {
			return ({
				...amounts,
				[toAddress(tokenAddress)]: amounts[toAddress(tokenAddress)] || toNormalizedBN(balance.raw, balance.decimals)
			});
		});
	});

	return (
		<div
			id={`${safeChainID}-${toAddress(tokenAddress)}`}
			className={`group relative grid w-full grid-cols-1 border-0 border-t border-neutral-200 bg-neutral-0 py-2 px-4 text-left transition-colors hover:bg-neutral-100/50 md:grid-cols-9 md:border-none md:px-6 ${isDisabled ? 'pointer-events-none opacity-30' : ''}`}>
			<div className={'absolute left-3 top-7 z-10 flex h-full justify-center md:left-6 md:top-0 md:items-center'}>
				<input
					type={'checkbox'}
					onChange={onToggle}
					checked={isSelected}
					className={'checkbox cursor-pointer'} />
			</div>
			<div className={'col-span-3 mb-2 flex h-16 flex-row items-start border-0 border-neutral-200 py-4 pl-8 md:mb-0 md:border-r md:py-0'}>
				<div className={'yearn--table-token-section-item h-16 pt-1'}>
					<div className={'yearn--table-token-section-item-image'}>
						<ImageWithFallback
							id={`${safeChainID}-${toAddress(tokenAddress)}-img`}
							alt={''}
							width={40}
							height={40}
							quality={90}
							src={`https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/multichain-tokens/${safeChainID}/${toAddress(tokenAddress)}/logo-128.png`} />
					</div>
					<div>
						<div className={'flex flex-row items-center space-x-2'}>
							<b>{balance.symbol}</b>
						</div>
						<Link
							href={`${explorer || 'https://etherscan.io'}/address/${tokenAddress}`}
							onClick={(e): void => e.stopPropagation()}
							className={'flex cursor-pointer flex-row items-center space-x-2 text-neutral-500 transition-colors hover:text-neutral-900 hover:underline'}>
							<p className={'font-mono text-xs'}>{truncateHex(tokenAddress, 8)}</p>
							<IconLinkOut className={'h-3 w-3'} />
						</Link>
					</div>
				</div>
			</div>

			<TokenRowInput
				amount={amount}
				balance={balance}
				tokenAddress={tokenAddress}
				isSelected={isSelected}
				onDisable={set_isDisabled} />
		</div>
	);
});

export default TokenRow;