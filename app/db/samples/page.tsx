import {DataService} from '@/services/dataService';
import Table from '@/components/Table';

export default async function Home() {
    const languages = await DataService.getAllLanguages();
    const paymentMethods = await DataService.getAllPaymentMethods();
    const profiles = await DataService.getProfiles();
    // Sample id: cm7ue9wgo00006xlscxwb2188
    const singleProfile = await DataService.getProfiles({userId: "cm7ue9wgo00006xlscxwb2188"});
    const users = await DataService.getUsers();

    return (
        <div className="min-h-screen p-8 pb-20 gap-8">
            <main className="flex flex-col gap-8 items-start">

                <Table
                    title="Profiles"
                    data={profiles}
                    columns={[
                        {key: 'id', label: 'ID'},
                        {key: 'userId', label: 'User ID'},
                        {key: 'name', label: 'Name'},
                        {key: 'price', label: 'Price', render: row => `$${row.price}`},
                        {key: 'languages', label: 'Languages', render: row => row.languages.map(l => l.language.name).join(', ')},
                        {key: 'paymentMethods', label: 'Payment Methods', render: row => row.paymentMethods.map(pm => pm.paymentMethod.name).join(', ')}
                    ]}
                />

                <Table
                    title="Single profile"
                    data={singleProfile}
                    columns={[
                        {key: 'id', label: 'ID'},
                        {key: 'userId', label: 'User ID'},
                        {key: 'name', label: 'Name'},
                        {key: 'price', label: 'Price', render: row => `$${row.price}`},
                        {key: 'languages', label: 'Languages', render: row => row.languages.map(l => l.language.name).join(', ')},
                        {key: 'paymentMethods', label: 'Payment Methods', render: row => row.paymentMethods.map(pm => pm.paymentMethod.name).join(', ')}
                    ]}
                />

                <Table
                    title="Users"
                    data={users}
                    columns={[{key: 'id', label: 'ID'}, {key: 'name', label: 'Name'}]}
                />

                <Table
                    title="Languages"
                    data={languages}
                    columns={[{key: 'id', label: 'ID'}, {key: 'name', label: 'Name'}]}
                />

                <Table
                    title="Payment Methods"
                    data={paymentMethods}
                    columns={[{key: 'id', label: 'ID'}, {key: 'name', label: 'Name'}]}
                />

            </main>
        </div>
    );
}
