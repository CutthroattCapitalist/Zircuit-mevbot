import { Card, Typography } from 'antd';
import { useContractExistsAtAddress } from 'eth-hooks';
import { useEthersContext } from 'eth-hooks/context';
import { TEthersAdaptor } from 'eth-hooks/models';
import { BaseContract, ContractFunction } from 'ethers';
import { FunctionFragment } from 'ethers/lib/utils';
import React, { FC, PropsWithChildren, ReactElement, useState } from 'react';

import { DisplayVariable } from './DisplayVariable';
import { FunctionForm } from './FunctionFrom';
import { NoContractDisplay } from './NoContractDisplay';

const { Text } = Typography;

import { Account } from '~~/ant';
const isQueryable = (fn: FunctionFragment): boolean =>
  (fn.stateMutability === 'view' || fn.stateMutability === 'pure') && fn.inputs.length === 0;

interface IGenericContract<GContract extends BaseContract> {
  mainnetAdaptor: TEthersAdaptor | undefined;
  contract: GContract | undefined;
  contractName: string;
  addressElement?: ReactElement;
  gasPrice?: number;
  show?: string[];
  tokenPrice?: number;
  blockExplorer: string;
}

export const GenericContract = <GContract extends BaseContract>(
  props: PropsWithChildren<IGenericContract<GContract>>
): ReturnType<FC<IGenericContract<GContract>>> => {
  const ethersContext = useEthersContext();
  const [contractIsDeployed] = useContractExistsAtAddress(props.contract);
  const [refreshRequired, setTriggerRefresh] = useState(false);

  const displayedContractFunctions = props.contract
    ? Object.values(props.contract.interface.functions).filter(
        (fn) => fn.type === 'function' && !(props.show && props.show.indexOf(fn.name) < 0)
      )
    : [];

  const contractDisplay = displayedContractFunctions.map((fn) => {
    if (!ethersContext.signer) return <></>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const contractFunc: ContractFunction<any> =
      fn.stateMutability === 'view' || fn.stateMutability === 'pure'
        ? props.contract?.functions[fn.name]
        : props.contract?.connect(ethersContext.signer)?.[fn.name];

    if (typeof contractFunc === 'function') {
      if (isQueryable(fn)) {
        // If there are no inputs, just display return value
        return (
          <DisplayVariable
            key={'DD' + fn.name}
            contractFunction={props.contract?.functions[fn.name]}
            functionInfo={fn}
            refreshRequired={refreshRequired}
            setTriggerRefresh={setTriggerRefresh}
          />
        );
      }
      // If there are inputs, display a form to allow users to provide these
      return (
        <FunctionForm
          key={'FF' + fn.name}
          contractFunction={contractFunc}
          functionFragment={fn}
          gasPrice={props.gasPrice ?? 0}
          setTriggerRefresh={setTriggerRefresh}
        />
      );
    }
    return null;
  });

  const fontSize = 24;

  return (
    <div style={{ margin: 'auto', width: '70vw' }}>
      <Card
        title={
          <div>
            <Text style={{ fontSize: fontSize, verticalAlign: 'middle' }}>{props.contractName}</Text>
            <div style={{ float: 'right' }}>
              <Account
                signer={props.contract?.signer}
                ensProvider={props.mainnetAdaptor?.provider}
                price={props.tokenPrice ?? 0}
                blockExplorer={props.blockExplorer}
                fontSize={fontSize}
                hasContextConnect={false}
              />
              {props.addressElement}
            </div>
          </div>
        }
        size="default"
        style={{ marginTop: 25, width: '100%' }}
        loading={ethersContext.provider == null || ethersContext.signer == null}>
        {contractIsDeployed ? (
          contractDisplay
        ) : (
          <NoContractDisplay showLoading={ethersContext.signer == null || props.contract?.provider == null} />
        )}
      </Card>
    </div>
  );
};
