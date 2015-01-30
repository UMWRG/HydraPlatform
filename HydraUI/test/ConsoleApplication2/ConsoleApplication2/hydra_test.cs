using System;
using System.Collections.Generic;
using System.Text;
using System.Web;
using System.Xml;
using Newtonsoft.Json;
using ConsoleApplication2.HYDRA_LOCAL;

namespace ConsoleApplication2
{
    class hydra_test
    {

        public class Descriptor : object
        {

            public string desc_val;
        }

        public class Column{
            public List<Row> rows {get;set;}
        }

        public class Row{
            public string timestep { get; set; }
            public string value    {get;set;}
        }

        static void Main(string[] args)
        {
            string test_value = @"{""0"":{""2011-01-04T12:11:00.000000000Z"":8,""2012-01-04T00:00:00.000000000Z"":8.5},""1"":{""2011-01-04T12:11:00.000000000Z"":9,""2012-01-04T00:00:00.000000000Z"":9.5}}";
            dynamic blah = JsonConvert.DeserializeObject<dynamic>(test_value);
            Console.WriteLine("Testing: " + blah["0"]);
            IDictionary<int, IDictionary<string,dynamic>> x = JsonConvert.DeserializeObject<IDictionary<int, IDictionary<string, dynamic>>>(test_value);

            foreach (int r in x.Keys)
            {
                foreach (string key in x[r].Keys)
                {
                    Console.WriteLine(key + " " + x[r][key]);
                }
            }
            HydraSoapApplicationClient cli = new HydraSoapApplicationClient("HydraSoapApplication");

            HYDRA_LOCAL.login l = new HYDRA_LOCAL.login();
            l.username = "root";
            l.password = "";
            HYDRA_LOCAL.loginResponse session = cli.login(l);
            Console.Write(session.loginResult);

            HYDRA_LOCAL.RequestHeader header = new HYDRA_LOCAL.RequestHeader();
            header.session_id = session.loginResult.session_id;

        //    HYDRA_LOCAL.get_network hmmm = new HYDRA_LOCAL.get_network();
        //    hmmm.network_id = "2";
        //    HYDRA_LOCAL.get_networkResponse resp = cli.get_network(header, hmmm);
        //    for (int i = 0; i < resp.get_networkResult.scenarios[0].resourcescenarios.Length; i++)
        //    {
        //        HYDRA_LOCAL.Dataset d = resp.get_networkResult.scenarios[0].resourcescenarios[i].value;   
        //        if (d.type == "timeseries"){
        //             Console.WriteLine(d);
        //        }
        //    }
            //HYDRA_LOCAL.Dataset d = resp.get_networkResult.scenarios[0].resourcescenarios[0].value;
            hydra_test p = new hydra_test();

            p.add_network(cli, header);

            Console.Read();
        }

        public void add_network(HYDRA_LOCAL.HydraSoapApplicationClient hd, HYDRA_LOCAL.RequestHeader header)
        {

            string project_id = "2";
            try
            {
                HYDRA_LOCAL.get_project_by_name proj_req = new HYDRA_LOCAL.get_project_by_name();
                proj_req.project_name = "Windows project";
                HYDRA_LOCAL.get_project_by_nameResponse p = hd.get_project_by_name(header, proj_req);
                project_id = p.get_project_by_nameResult.id;
            }
            catch (Exception e)
            {
                HYDRA_LOCAL.Project proj = new HYDRA_LOCAL.Project();
                proj.name = "Windows project";
                proj.description = "Project created by windows";

                HYDRA_LOCAL.add_project add_proj = new HYDRA_LOCAL.add_project();
                add_proj.project = proj;
                HYDRA_LOCAL.add_projectResponse p = hd.add_project(header, add_proj);
                project_id = p.add_projectResult.id;
            }

            HYDRA_LOCAL.Attr[] attrs = new HYDRA_LOCAL.Attr[3];

            attrs[0] = create_attr(hd, "windows attribute 1", header);
            attrs[1] = create_attr(hd, "windows attribute 2", header);
            attrs[2] = create_attr(hd, "windows attribute 3", header);


            HYDRA_LOCAL.Network net = new HYDRA_LOCAL.Network();
            net.project_id  = project_id;
            net.name = "Test Windows Network" + DateTime.Now.ToString();
            net.description = "A network build on windows";

            HYDRA_LOCAL.Node[] nodes = new HYDRA_LOCAL.Node[3];
            HYDRA_LOCAL.Link[] links = new HYDRA_LOCAL.Link[2];

            nodes[0] = create_node("-1", "node A", "windows node 1", (decimal)0.1, (decimal)0.1, attrs);
            nodes[1] = create_node("-2", "node B", "windows node 2", (decimal)0.2, (decimal)0.2, new HYDRA_LOCAL.Attr[0]);
            nodes[2] = create_node("-3", "node C", "windows node 3", (decimal)0.3, (decimal)0.3, new HYDRA_LOCAL.Attr[0]);

            HYDRA_LOCAL.ResourceScenario[] data = new HYDRA_LOCAL.ResourceScenario[3];
            data[0] = create_timeseries(nodes[0].attributes[0]);
            //data[0] = create_descriptor(nodes[0].attributes[0], "d1");
            data[1] = create_descriptor(nodes[0].attributes[1], "d2");
            data[2] = create_array(nodes[0].attributes[2]);

            links[0] = create_link("link X", "link A to B", nodes[0].id, nodes[1].id, new HYDRA_LOCAL.Attr[0]);
            links[1] = create_link("link Y", "link B to C", nodes[1].id, nodes[2].id, new HYDRA_LOCAL.Attr[0]);

            net.nodes = nodes;
            net.links = links;

            HYDRA_LOCAL.Scenario scenario = create_scenario("Windows scenario!", data);
            net.scenarios = new HYDRA_LOCAL.Scenario[] { scenario };

            HYDRA_LOCAL.add_network add_net = new HYDRA_LOCAL.add_network();
            add_net.net = net;

            HYDRA_LOCAL.add_networkResponse n = hd.add_network(header, add_net);

            HYDRA_LOCAL.get_all_node_data nd = new HYDRA_LOCAL.get_all_node_data();
            nd.network_id = n.add_networkResult.id;
            nd.scenario_id = n.add_networkResult.scenarios[0].id;
            nd.node_ids = null;
            HYDRA_LOCAL.get_all_node_dataResponse node_resp = hd.get_all_node_data(header, nd);
            for (int i=0; i<node_resp.get_all_node_dataResult.Length; i++){
                HYDRA_LOCAL.ResourceAttr node_data = node_resp.get_all_node_dataResult[i];
                HYDRA_LOCAL.Dataset d = node_data.resourcescenario.value;
                if (d.type == "timeseries"){
                    Console.WriteLine(d.value);
                    HYDRA_LOCAL.update_resourcedata upd = new HYDRA_LOCAL.update_resourcedata();
                    HYDRA_LOCAL.ResourceScenario[] upd_rs = { node_data.resourcescenario };
                    System.Xml.XmlNode[] j = (System.Xml.XmlNode[])d.value;
                    j[1].InnerXml = "<ts_time>2011-01-04 12:11:00</ts_time><ts_value><array><item>1</item><item>2</item><item>3</item><item></item></array></ts_value>";
                    upd.resource_scenarios = upd_rs;
                    upd.scenario_id = "2"; 
                    DateTime dtu1 = DateTime.Now;
                    HYDRA_LOCAL.update_resourcedataResponse upd_resp = hd.update_resourcedata(header, upd);
                    DateTime dtu2 = DateTime.Now;
                    Console.WriteLine(dtu2 - dtu1);
                    break;
                }
            }

            HYDRA_LOCAL.test_get_all_node_data test_nd = new HYDRA_LOCAL.test_get_all_node_data();
            test_nd.network_id = "2";
            test_nd.scenario_id = "2";
            test_nd.node_ids = null;
            DateTime dt1 = DateTime.Now;
            Console.WriteLine(dt1);
            HYDRA_LOCAL.test_get_all_node_dataResponse test_node_resp = hd.test_get_all_node_data(header, test_nd);
            for (int i = 0; i < test_node_resp.test_get_all_node_dataResult.Length; i++)
            {
                HYDRA_LOCAL.ResourceData test_d = test_node_resp.test_get_all_node_dataResult[i];
                if (test_d.dataset_type == "timeseries"){
                    Console.WriteLine(test_d.dataset_value);
                    break;
                }
            }
            DateTime dt2 = DateTime.Now;
            Console.WriteLine(dt2-dt1);
            Console.WriteLine("Finished");
        }

        private HYDRA_LOCAL.Scenario create_scenario(string name, HYDRA_LOCAL.ResourceScenario[] rs)
        {
            HYDRA_LOCAL.Scenario scenario = new HYDRA_LOCAL.Scenario();
            scenario.id = "-1";
            scenario.name = name;
            scenario.description = "A scenario created on windows";
            scenario.resourcescenarios = rs;

            return scenario;
        
        }

        private HYDRA_LOCAL.Attr create_attr(HYDRA_LOCAL.HydraSoapApplicationClient hd, string name, HYDRA_LOCAL.RequestHeader header)
        {
            HYDRA_LOCAL.get_attribute get_attr = new HYDRA_LOCAL.get_attribute();
            get_attr.name = name;
            HYDRA_LOCAL.get_attributeResponse attr_resp = hd.get_attribute(header, get_attr);

            HYDRA_LOCAL.Attr attr = new HYDRA_LOCAL.Attr();
            if (attr_resp.get_attributeResult != null)
            {
                attr.dimen = attr_resp.get_attributeResult.dimen;
                attr.id = attr_resp.get_attributeResult.id;
                attr.name = attr_resp.get_attributeResult.name;
            }
            else
            {
                attr.dimen = "really big";
                attr.name = name;
                HYDRA_LOCAL.add_attribute add_attr_wrapper = new HYDRA_LOCAL.add_attribute();
                add_attr_wrapper.attr = attr;
                HYDRA_LOCAL.add_attributeResponse add_attr_resp = hd.add_attribute(header, add_attr_wrapper);
                attr.id = add_attr_resp.add_attributeResult.id;
            }
            return attr;
        }

        private HYDRA_LOCAL.Node create_node(String id, String name, String desc, Decimal x, Decimal y, HYDRA_LOCAL.Attr[] attrs)
        {
            HYDRA_LOCAL.Node node  = new HYDRA_LOCAL.Node();
            node.id          = id;
            node.name        = name;
            node.description = desc;
            node.x           = x;
            node.y           = y;

            if (attrs != null)
            {
                HYDRA_LOCAL.ResourceAttr[] ras = new HYDRA_LOCAL.ResourceAttr[attrs.Length];
                for (int i=0; i<attrs.Length; i++){

                    HYDRA_LOCAL.Attr attr = attrs[i];
                    HYDRA_LOCAL.ResourceAttr ra = new HYDRA_LOCAL.ResourceAttr();
                    int ra_id = (i + 1) * -1;
                    ra.id = ra_id.ToString();
                    ra.attr_id = attr.id;
                    ras[i] = ra;
                }
                node.attributes = ras;
            }

            return node;
        }

        private HYDRA_LOCAL.Link create_link(String name, String desc, String node_a_id, String node_b_id, HYDRA_LOCAL.Attr[] attrs)
        {
            HYDRA_LOCAL.Link link  = new HYDRA_LOCAL.Link();
            link.name        = name;
            link.description = desc;
            link.node_1_id   = node_a_id;
            link.node_2_id   = node_b_id;

            return link;
        }

        private HYDRA_LOCAL.ResourceScenario create_descriptor(HYDRA_LOCAL.ResourceAttr ra, string descriptor)
        {

            //XmlNode test = new XmlNode();
            //test.
            HYDRA_LOCAL.Dataset dataset = new HYDRA_LOCAL.Dataset();

            System.Xml.XmlNode[] val = new XmlNode[1];
            XmlDocument doc = new XmlDocument();
            XmlNode n = doc.CreateElement("desc_val");
            n.InnerText = descriptor;
            val[0] = n;
            dataset.value = val;

            dataset.unit = "string";
            dataset.name = "Description of a windows descriptor";
            dataset.type = "descriptor";
            dataset.dimension = "really big";

            HYDRA_LOCAL.ResourceScenario rs = new HYDRA_LOCAL.ResourceScenario();
            rs.attr_id = ra.attr_id;
            rs.resource_attr_id = ra.id;
            rs.value = dataset;

            return rs;
        }

        private HYDRA_LOCAL.ResourceScenario create_array(HYDRA_LOCAL.ResourceAttr ra)
        {

            HYDRA_LOCAL.Dataset dataset = new HYDRA_LOCAL.Dataset();

            System.Xml.XmlNode[] val = new XmlNode[1];
            XmlDocument doc = new XmlDocument();
            XmlNode n = doc.CreateElement("arr_data");
            n.InnerXml = "<array><item>1</item><item>2</item><item>3</item><item>4</item></array>";
            val[0] = n;

            dataset.value = val;

            dataset.unit = "metres";
            dataset.name = "A windows generated array";
            dataset.type = "array";
            dataset.dimension = "2d matrix";

            HYDRA_LOCAL.ResourceScenario rs = new HYDRA_LOCAL.ResourceScenario();
            rs.attr_id = ra.attr_id;
            rs.resource_attr_id = ra.id;
            rs.value = dataset;
            return rs;
        }

        private HYDRA_LOCAL.ResourceScenario create_timeseries(HYDRA_LOCAL.ResourceAttr ra)
        {
            string format = "yyyy-MM-dd hh:mm:ss.0";
            XmlDocument doc = new XmlDocument();
            DateTime n = DateTime.Now;
            
            XmlNode val1 = doc.CreateElement("ts_values");
            val1.InnerXml = "<ts_time>" + n.ToString(format) + "</ts_time><ts_value>1</ts_value>";
            XmlNode val2 = doc.CreateElement("ts_values");
           DateTime n2 = n.AddHours(1);
            val2.InnerXml = "<ts_time>" + n2.ToString(format) + "</ts_time><ts_value>2</ts_value>";
            System.Xml.XmlNode[] val = new XmlNode[] {val1, val2};
            
            HYDRA_LOCAL.Dataset dataset = new HYDRA_LOCAL.Dataset();
            dataset.value = val;

            dataset.unit = "m3";
            dataset.name = "A windows time series";
            dataset.type = "timeseries";
            dataset.dimension = "volume";

            HYDRA_LOCAL.ResourceScenario rs = new HYDRA_LOCAL.ResourceScenario();
            rs.attr_id = ra.attr_id;
            rs.resource_attr_id = ra.id;
            rs.value = dataset;

            return rs;
        }
    }
}
